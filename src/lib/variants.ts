import type { ProductCombination, VariantOptionGroup, VariantOptionValue } from '../data/types';

export type AttributeGroupType = 'size' | 'color' | 'select';

/** Womni AttributeGroup.id → sync key (`g{id}`). */
export function attributeGroupKey(groupId: string | number): string {
	return `g${groupId}`;
}

export function parseAttributeIds(raw: string | null | undefined): string[] {
	if (!raw) {
		return [];
	}
	try {
		const parsed = JSON.parse(raw) as string[];
		return Array.isArray(parsed) ? parsed.map(String) : [];
	} catch {
		return [];
	}
}

export function parseSelections(raw: string | null | undefined): Record<string, string> {
	if (!raw) {
		return {};
	}
	try {
		const parsed = JSON.parse(raw) as Record<string, string>;
		return parsed && typeof parsed === 'object' ? parsed : {};
	} catch {
		return {};
	}
}

/** Accept legacy `values: string[]` or Womni-shaped `VariantOptionValue[]`. */
export function normalizeOptionValue(raw: string | VariantOptionValue, index: number): VariantOptionValue {
	if (typeof raw === 'string') {
		return { id: String(index), name: raw, position: index };
	}
	return {
		id: String(raw.id),
		name: raw.name,
		color: raw.color ?? null,
		texture: raw.texture ?? null,
		position: raw.position ?? index,
	};
}

export function normalizeOptionGroups(raw: unknown): VariantOptionGroup[] {
	if (!Array.isArray(raw)) {
		return [];
	}

	return raw
		.map((group, groupIndex) => {
			if (!group || typeof group !== 'object') {
				return null;
			}
			const record = group as Record<string, unknown>;
			const id = String(record.id ?? record.key ?? groupIndex);
			const key = String(record.key ?? attributeGroupKey(id));
			const valuesRaw = Array.isArray(record.values) ? record.values : [];
			const values = valuesRaw.map((value, valueIndex) =>
				normalizeOptionValue(value as string | VariantOptionValue, valueIndex),
			);

			return {
				id,
				key,
				groupType: (record.groupType as AttributeGroupType) || 'select',
				name: String(record.name ?? key),
				position: Number(record.position ?? groupIndex),
				values,
			};
		})
		.filter((group): group is VariantOptionGroup => group != null)
		.sort((a, b) => a.position - b.position || a.name.localeCompare(b.name, 'pt'));
}

export function optionLabelById(
	groups: VariantOptionGroup[] | undefined,
	groupKey: string,
	attributeId: string,
): string | null {
	const group = groups?.find((entry) => entry.key === groupKey);
	const value = group?.values.find((entry) => entry.id === attributeId);
	return value?.name ?? null;
}

export function labelsFromSelections(
	groups: VariantOptionGroup[] | undefined,
	selections: Record<string, string>,
): Record<string, string> {
	const labels: Record<string, string> = {};
	for (const [groupKey, attributeId] of Object.entries(selections)) {
		const label = optionLabelById(groups, groupKey, attributeId);
		if (label) {
			labels[groupKey] = label;
		}
	}
	return labels;
}

export function resolveCombinationSelections(
	combo: ProductCombination,
	groups?: VariantOptionGroup[],
): Record<string, string> {
	if (Object.keys(combo.selections).length) {
		return combo.selections;
	}

	const resolved: Record<string, string> = {};
	for (const [groupKey, label] of Object.entries(combo.options)) {
		const group = groups?.find((entry) => entry.key === groupKey);
		const value = group?.values.find((entry) => entry.name === label);
		if (value) {
			resolved[groupKey] = value.id;
		}
	}
	return resolved;
}

export function selectionsMatch(
	combo: ProductCombination,
	selected: Record<string, string>,
	groups?: VariantOptionGroup[],
): boolean {
	const comboSelections = resolveCombinationSelections(combo, groups);
	if (Object.keys(comboSelections).length) {
		return Object.entries(selected).every(
			([groupKey, attributeId]) => comboSelections[groupKey] === attributeId,
		);
	}

	return Object.entries(selected).every(([groupKey, attributeId]) => {
		const label = optionLabelById(groups, groupKey, attributeId);
		return label != null && combo.options[groupKey] === label;
	});
}

export function buildOptionGroupsFromCombinations(
	combinations: ProductCombination[],
): VariantOptionGroup[] {
	const groups = new Map<string, VariantOptionGroup>();

	for (const combo of combinations) {
		const selections = resolveCombinationSelections(combo);
		for (const [groupKey, label] of Object.entries(combo.options)) {
			if (!groups.has(groupKey)) {
				groups.set(groupKey, {
					id: groupKey.replace(/^g/, '') || groupKey,
					key: groupKey,
					groupType: 'select',
					name: groupKey,
					position: groups.size,
					values: [],
				});
			}
			const group = groups.get(groupKey)!;
			const attributeId = selections[groupKey] ?? String(group.values.length);
			if (!group.values.some((value) => value.id === attributeId)) {
				group.values.push({
					id: attributeId,
					name: label,
					position: group.values.length,
				});
			}
		}
	}

	return [...groups.values()].sort((a, b) => a.key.localeCompare(b.key));
}
