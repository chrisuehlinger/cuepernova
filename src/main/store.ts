import Store from 'electron-store';

interface StoreSchema {
  lastProjectDirectory?: string;
}

const store = new Store<StoreSchema>({
  name: 'cuepernova-app-settings',
  defaults: {},
});

export const getLastProjectDirectory = (): string | undefined => {
  return store.get('lastProjectDirectory');
};

export const setLastProjectDirectory = (directory: string): void => {
  store.set('lastProjectDirectory', directory);
};

export const clearLastProjectDirectory = (): void => {
  store.delete('lastProjectDirectory');
};

export default store;
