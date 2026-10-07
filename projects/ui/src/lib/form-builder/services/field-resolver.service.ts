import { Injectable } from '@angular/core';
import { FieldConfig, ConditionRule, OperatorType } from '../models';

@Injectable({ providedIn: 'root' })
export class FieldResolverService {
  shouldShowField(field: FieldConfig, formValues: Record<string, any>): boolean {
    // Check if field is explicitly hidden
    if (field.hidden) {
      return false;
    }

    // Check showWhen conditions
    if (field.showWhen) {
      const conditions = Array.isArray(field.showWhen) ? field.showWhen : [field.showWhen];
      // All conditions must be true (AND logic)
      return conditions.every((condition) => this.evaluateCondition(condition, formValues));
    }

    // Check hideWhen conditions
    if (field.hideWhen) {
      const conditions = Array.isArray(field.hideWhen) ? field.hideWhen : [field.hideWhen];
      // If any condition is true, hide the field (OR logic)
      return !conditions.some((condition) => this.evaluateCondition(condition, formValues));
    }

    // Show by default
    return true;
  }

  getDependentFields(fieldKey: string, allFields: FieldConfig[]): FieldConfig[] {
    return allFields.filter((field) => {
      if (!field.dependsOn) return false;

      const dependencies = Array.isArray(field.dependsOn) ? field.dependsOn : [field.dependsOn];
      return dependencies.some((dep) => dep.field === fieldKey);
    });
  }

  getFieldsWithDependency(allFields: FieldConfig[]): Map<string, FieldConfig[]> {
    const dependencyMap = new Map<string, FieldConfig[]>();

    for (const field of allFields) {
      if (field.dependsOn) {
        const dependencies = Array.isArray(field.dependsOn) ? field.dependsOn : [field.dependsOn];

        for (const dep of dependencies) {
          const existing = dependencyMap.get(dep.field) || [];
          existing.push(field);
          dependencyMap.set(dep.field, existing);
        }
      }
    }

    return dependencyMap;
  }

  private evaluateCondition(condition: ConditionRule, formValues: Record<string, any>): boolean {
    const fieldValue = formValues[condition.field];

    switch (condition.operator) {
      case 'eq':
        return fieldValue === condition.value;

      case 'neq':
        return fieldValue !== condition.value;

      case 'in':
        return condition.values?.includes(fieldValue) || false;

      case 'nin':
        return !condition.values?.includes(fieldValue);

      case 'gt':
        return fieldValue > condition.value;

      case 'gte':
        return fieldValue >= condition.value;

      case 'lt':
        return fieldValue < condition.value;

      case 'lte':
        return fieldValue <= condition.value;

      case 'contains':
        if (typeof fieldValue === 'string' && typeof condition.value === 'string') {
          return fieldValue.toLowerCase().includes(condition.value.toLowerCase());
        }
        if (Array.isArray(fieldValue)) {
          return fieldValue.includes(condition.value);
        }
        return false;

      default:
        console.warn(`Unknown operator: ${condition.operator}`);
        return true;
    }
  }

  evaluateConditions(
    conditions: ConditionRule[],
    formValues: Record<string, any>,
    logic: 'AND' | 'OR' = 'AND',
  ): boolean {
    if (logic === 'AND') {
      return conditions.every((condition) => this.evaluateCondition(condition, formValues));
    } else {
      return conditions.some((condition) => this.evaluateCondition(condition, formValues));
    }
  }
}
