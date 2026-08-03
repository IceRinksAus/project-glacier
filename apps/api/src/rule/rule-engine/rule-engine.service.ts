import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

type RuleContext = Record<string, unknown>;

type RuleCondition = {
  field: string;
  operator: string;
  value: unknown;
};

type RuleConditionGroup = {
  all?: RuleCondition[];
  any?: RuleCondition[];
};

type RuleAction = {
  type: string;
  productSlug?: string;
  quantityPerMatchingItem?: number;
};

export type RequiredProductResult = {
  productSlug: string;
  quantity: number;
  ruleId: string;
  ruleName: string;
  message: string | null;
};

export type RuleEvaluationResult = {
  valid: boolean;
  matchedRuleIds: string[];
  requiredProducts: RequiredProductResult[];
  errors: string[];
  warnings: string[];
};

@Injectable()
export class RuleEngineService {
  constructor(private readonly prisma: PrismaService) {}

  async evaluate(
    eventId: string,
    context: RuleContext,
  ): Promise<RuleEvaluationResult> {
    const rules = await this.prisma.rule.findMany({
      where: {
        eventId,
        status: 'ACTIVE',
      },
      orderBy: [
        {
          priority: 'desc',
        },
        {
          createdAt: 'asc',
        },
      ],
    });

    const result: RuleEvaluationResult = {
      valid: true,
      matchedRuleIds: [],
      requiredProducts: [],
      errors: [],
      warnings: [],
    };

    for (const rule of rules) {
      const conditions = this.parseConditions(rule.conditions);

      if (!conditions) {
        continue;
      }

      const matches = this.evaluateConditionGroup(conditions, context);

      if (!matches) {
        continue;
      }

      result.matchedRuleIds.push(rule.id);

      const action = this.parseAction(rule.actions);

      if (!action) {
        continue;
      }

      switch (action.type) {
        case 'REQUIRE_PRODUCT': {
          if (!action.productSlug) {
            break;
          }

          result.requiredProducts.push({
            productSlug: action.productSlug,
            quantity: action.quantityPerMatchingItem ?? 1,
            ruleId: rule.id,
            ruleName: rule.name,
            message: rule.message,
          });

          break;
        }

        case 'BLOCK_BOOKING': {
          result.valid = false;
          result.errors.push(
            rule.message ?? `Booking blocked by rule: ${rule.name}`,
          );

          break;
        }

        case 'WARNING': {
          result.warnings.push(
            rule.message ?? `Warning triggered by rule: ${rule.name}`,
          );

          break;
        }
      }

      if (rule.stopProcessing) {
        break;
      }
    }

    return result;
  }

  private evaluateConditionGroup(
    group: RuleConditionGroup,
    context: RuleContext,
  ): boolean {
    if (group.all?.length) {
      const allMatch = group.all.every((condition) =>
        this.evaluateCondition(condition, context),
      );

      if (!allMatch) {
        return false;
      }
    }

    if (group.any?.length) {
      const anyMatch = group.any.some((condition) =>
        this.evaluateCondition(condition, context),
      );

      if (!anyMatch) {
        return false;
      }
    }

    return Boolean(group.all?.length || group.any?.length);
  }

  private evaluateCondition(
    condition: RuleCondition,
    context: RuleContext,
  ): boolean {
    const actualValue = context[condition.field];
    const expectedValue = condition.value;

    switch (condition.operator) {
      case 'EQUALS':
        return actualValue === expectedValue;

      case 'NOT_EQUALS':
        return actualValue !== expectedValue;

      case 'GREATER_THAN':
        return (
          typeof actualValue === 'number' &&
          typeof expectedValue === 'number' &&
          actualValue > expectedValue
        );

      case 'GREATER_THAN_OR_EQUAL':
        return (
          typeof actualValue === 'number' &&
          typeof expectedValue === 'number' &&
          actualValue >= expectedValue
        );

      case 'LESS_THAN':
        return (
          typeof actualValue === 'number' &&
          typeof expectedValue === 'number' &&
          actualValue < expectedValue
        );

      case 'LESS_THAN_OR_EQUAL':
        return (
          typeof actualValue === 'number' &&
          typeof expectedValue === 'number' &&
          actualValue <= expectedValue
        );

      case 'IN':
        return Array.isArray(expectedValue)
          ? expectedValue.includes(actualValue)
          : false;

      case 'NOT_IN':
        return Array.isArray(expectedValue)
          ? !expectedValue.includes(actualValue)
          : false;

      case 'EXISTS':
        return actualValue !== undefined && actualValue !== null;

      case 'NOT_EXISTS':
        return actualValue === undefined || actualValue === null;

      default:
        return false;
    }
  }

  private parseConditions(
    value: Prisma.JsonValue,
  ): RuleConditionGroup | null {
    if (!this.isObject(value)) {
      return null;
    }

    const group: RuleConditionGroup = {};

    if (Array.isArray(value.all)) {
      group.all = value.all
        .map((condition) => this.parseCondition(condition))
        .filter((condition): condition is RuleCondition => condition !== null);
    }

    if (Array.isArray(value.any)) {
      group.any = value.any
        .map((condition) => this.parseCondition(condition))
        .filter((condition): condition is RuleCondition => condition !== null);
    }

    return group;
  }

  private parseCondition(value: unknown): RuleCondition | null {
    if (!this.isObject(value)) {
      return null;
    }

    if (
      typeof value.field !== 'string' ||
      typeof value.operator !== 'string'
    ) {
      return null;
    }

    return {
      field: value.field,
      operator: value.operator,
      value: value.value,
    };
  }

  private parseAction(value: Prisma.JsonValue): RuleAction | null {
    if (!this.isObject(value) || typeof value.type !== 'string') {
      return null;
    }

    return {
      type: value.type,
      productSlug:
        typeof value.productSlug === 'string'
          ? value.productSlug
          : undefined,
      quantityPerMatchingItem:
        typeof value.quantityPerMatchingItem === 'number'
          ? value.quantityPerMatchingItem
          : undefined,
    };
  }

  private isObject(
    value: unknown,
  ): value is Record<string, unknown> {
    return (
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value)
    );
  }
}