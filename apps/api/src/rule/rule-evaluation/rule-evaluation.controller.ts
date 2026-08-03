import {
  Body,
  Controller,
  Param,
  Post,
} from '@nestjs/common';
import { RuleEvaluationService } from './rule-evaluation.service';

type EvaluateRulesDto = {
  context: Record<string, unknown>;
};

@Controller('rule-evaluation')
export class RuleEvaluationController {
  constructor(
    private readonly ruleEvaluationService: RuleEvaluationService,
  ) {}

  @Post(':eventId')
  evaluate(
    @Param('eventId') eventId: string,
    @Body() body: EvaluateRulesDto,
  ) {
    return this.ruleEvaluationService.evaluate(
      eventId,
      body.context,
    );
  }
}