import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderEditForm } from '../../testing/renderEditForm';
import { shop } from './index';
import { newShopItem, shopDefault, shopSchema, validateShop, type ShopItem } from './schema';

const item = (over: Partial<ShopItem> = {}): ShopItem => ({
  ...newShopItem(0),
  name: 'Lemon Bowl',
  priceCents: 14000,
  ...over,
});

describe('shop schema', () => {
  it('accepts the default and a populated item', () => {
    expect(shopSchema.safeParse(shopDefault()).success).toBe(true);
    expect(shopSchema.safeParse({ enabled: true, currency: 'CAD', items: [item()] }).success).toBe(
      true,
    );
  });

  it('rejects non-integer prices and a missing inStock flag', () => {
    expect(
      shopSchema.safeParse({ enabled: true, currency: 'CAD', items: [item({ priceCents: 14.5 })] })
        .success,
    ).toBe(false);
    const { inStock: _omit, ...noStock } = item();
    expect(shopSchema.safeParse({ enabled: true, currency: 'CAD', items: [noStock] }).success).toBe(
      false,
    );
  });
});

describe('validateShop (stricter money rules)', () => {
  it('requires an ISO-shaped currency', () => {
    expect(() => validateShop({ enabled: true, currency: 'cad', items: [] })).toThrow(
      /3-letter ISO/,
    );
    expect(() => validateShop({ enabled: true, currency: 'CAD', items: [] })).not.toThrow();
  });

  it('requires a strictly positive price per item', () => {
    expect(() =>
      validateShop({ enabled: true, currency: 'CAD', items: [item({ priceCents: 0 })] }),
    ).toThrow(/positive integer/);
  });
});

describe('shop EditForm', () => {
  it('toggles enabled, adds an item, and stores price as integer cents', () => {
    const ui = renderEditForm(shop.EditForm, shopDefault());

    fireEvent.click(screen.getByLabelText('Shop enabled (visible in nav)'));
    expect(ui.data().enabled).toBe(true);

    fireEvent.click(screen.getByText('+ item'));
    expect(ui.data().items).toHaveLength(1);

    fireEvent.change(screen.getByPlaceholderText('Item name'), {
      target: { value: 'Telephone Table' },
    });
    fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '18.50' } });
    expect(ui.data().items[0]!.priceCents).toBe(1850); // dollars -> integer cents
    expect(ui.data().items[0]!.name).toBe('Telephone Table');
  });

  it('uppercases the currency as typed', () => {
    const ui = renderEditForm(shop.EditForm, shopDefault());
    fireEvent.change(screen.getByPlaceholderText('USD'), { target: { value: 'cad' } });
    expect(ui.data().currency).toBe('CAD');
  });
});
