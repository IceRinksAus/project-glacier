import { Module } from '@nestjs/common';
import { RuleService } from './rule.service';
import { RuleController } from './rule.controller';
import { RuleEngineService } from './rule-engine/rule-engine.service';
import { RuleEvaluationController } from './rule-evaluation/rule-evaluation.controller';
import { RuleEvaluationService } from './rule-evaluation/rule-evaluation.service';

@Module({
  controllers: [RuleController, RuleEvaluationController],
  providers: [
    RuleService,
    RuleEngineService,
    RuleEvaluationService,
  ],
  exports: [
    RuleEvaluationService,
  ],
})
export class RuleModule {}