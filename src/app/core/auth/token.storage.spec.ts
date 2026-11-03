import { TestBed } from '@angular/core/testing';

import { TokenStorage } from './token.storage';

describe('TokenStorage', () => {
  let storage: TokenStorage;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    storage = TestBed.inject(TokenStorage);
  });

  afterEach(() => localStorage.clear());

  it('starts empty', () => {
    expect(storage.get()).toBeNull();
    expect(storage.has()).toBeFalse();
  });

  it('persists and reads back the token', () => {
    storage.set('abc123');

    expect(storage.get()).toBe('abc123');
    expect(storage.has()).toBeTrue();
    expect(localStorage.getItem('erp.token')).toBe('abc123');
  });

  it('clears the token from memory and storage', () => {
    storage.set('abc123');
    storage.clear();

    expect(storage.get()).toBeNull();
    expect(localStorage.getItem('erp.token')).toBeNull();
  });
});
