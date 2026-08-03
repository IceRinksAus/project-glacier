import { Injectable } from '@nestjs/common';
import {
  RuleEngineService,
  RuleEvaluationResult,
} from '../rule-engine/rule-engine.service';

@Injectable()
export class RuleEvaluationService {
  constructor(
    private readonly ruleEngineService: RuleEngineService,
  ) {}

  evaluate(
    eventId: string,
    context: Record<string, unknown>,
  ): Promise<RuleEvaluationResult> {
    return this.ruleEngineService.evaluate(eventId, context);
  }
}