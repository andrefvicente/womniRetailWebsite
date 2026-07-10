export type BadgeKey = 'sale' | 'new' | 'bestseller';

export interface ProductFeature {
	name: string;
	value: string;
}

/** Mirrors Womni AttributeGroup.groupType */
export type AttributeGroupType = 'size' | 'color' | 'select';

/** Mirrors Womni Attribute (+ AttributeI18n.name). */
export interface VariantOptionValue {
	id: string;
	name: string;
	color?: string | null;
	texture?: string | null;
	position?: number;
}

/** Mirrors Womni AttributeGroup (+ AttributeGroupI18n + nested Attributes). */
export interface VariantOptionGroup {
	id: string;
	/** Stable sync key: `g{attributeGroupId}` */
	key: string;
	groupType: AttributeGroupType;
	name: string;
	position: number;
	values: VariantOptionValue[];
}

/** Mirrors Womni ProductAttribute (+ linked Attributes via ProductAttributeCombination). */
export interface ProductCombination {
	/** Womni ProductAttribute.id */
	id: string;
	/** Womni Attribute ids from ProductAttributeCombination */
	attributeIds: string[];
	/** groupKey → AttributeI18n.name (display) */
	options: Record<string, string>;
	/** groupKey → Attribute.id (stable matching) */
	selections: Record<string, string>;
	price: number;
	originalPrice?: number;
	promotionStart?: string;
	promotionEnd?: string;
	reference?: string;
	quantity: number;
	available: boolean;
	/** Primary image from Womni ProductAttributeImage */
	image?: string;
	/** All images linked to this combination */
	images?: string[];
}

/** Dados do produto (locale-agnóstico; textos vêm de i18n) */
export interface ProductBase {
	slug: string;
	price: number;
	originalPrice?: number;
	promotionStart?: string;
	promotionEnd?: string;
	image: string;
	images: string[];
	features?: ProductFeature[];
	optionGroups?: VariantOptionGroup[];
	combinations?: ProductCombination[];
	badge?: BadgeKey;
	categorySlug?: string;
}

/** Produto com textos já localizados para renderização */
export interface Product extends ProductBase {
	name: string;
	description: string;
	care: string;
}

export interface CategoryTile {
	slug: string;
	href: string;
	image: string;
	count?: number;
}
