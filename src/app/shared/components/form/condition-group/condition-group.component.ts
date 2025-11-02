import { ChangeDetectionStrategy, Component, model, output, input } from '@angular/core';
import {
  Condition,
  ConditionGroup,
  Field,
  LogicalOperator,
} from '../../../models/conditions.model';
import { ConditionRowComponent } from '../condition-row/condition-row.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-condition-group',
  templateUrl: './condition-group.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, FormsModule, ConditionRowComponent, ConditionGroupComponent],
})
export class ConditionGroupComponent {
  group = model.required<ConditionGroup>();
  fields = input.required<Field[]>();
  isRoot = input<boolean>(false);
  remove = output<void>();

  isCondition(item: Condition | ConditionGroup): item is Condition {
    return 'fieldId' in item;
  }

  // FIX: Correctly check for 'conditions' property which is unique to ConditionGroup.
  // The 'operator' property exists on both Condition and ConditionGroup and is not a safe discriminator,
  // leading to a compile error when trying to access 'item.conditions'.
  isGroup(item: Condition | ConditionGroup): item is ConditionGroup {
    return 'conditions' in item;
  }

  updateLogicalOperator(operator: LogicalOperator) {
    this.group.update((g) => ({ ...g, operator }));
  }

  addCondition() {
    const newCondition: Condition = {
      id: crypto.randomUUID(),
      fieldId: this.fields()[0].id,
      operator: this.fields()[0].operators[0],
      value: null,
    };
    this.group.update((g) => ({ ...g, conditions: [...g.conditions, newCondition] }));
  }

  addGroup() {
    const newGroup: ConditionGroup = {
      id: crypto.randomUUID(),
      operator: 'AND',
      conditions: [],
    };
    this.group.update((g) => ({ ...g, conditions: [...g.conditions, newGroup] }));
  }

  updateCondition(index: number, updatedCondition: Condition) {
    this.group.update((g) => {
      const newConditions = [...g.conditions];
      newConditions[index] = updatedCondition;
      return { ...g, conditions: newConditions };
    });
  }

  updateSubGroup(index: number, updatedGroup: ConditionGroup) {
    this.group.update((g) => {
      const newConditions = [...g.conditions];
      newConditions[index] = updatedGroup;
      return { ...g, conditions: newConditions };
    });
  }

  removeItem(index: number) {
    this.group.update((g) => {
      const newConditions = [...g.conditions];
      newConditions.splice(index, 1);
      return { ...g, conditions: newConditions };
    });
  }
}
