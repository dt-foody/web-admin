import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { ConditionGroup, Field } from '../../../models/conditions.model';
import { ConditionGroupComponent } from '../condition-group/condition-group.component';

@Component({
  selector: 'app-conditions-builder',
  templateUrl: './conditions-builder.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [ConditionGroupComponent],
})
export class ConditionsBuilderComponent {
  group = model.required<ConditionGroup>();
  fields = input.required<Field[]>();
}
