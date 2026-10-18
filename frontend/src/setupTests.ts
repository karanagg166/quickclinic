import '@testing-library/jest-dom';

// Mock axios to avoid ESM import issue with axios v1.x in Create React App Jest
jest.mock('axios', () => {
  const mockAxiosInstance = {
    get: jest.fn(() => Promise.resolve({ data: {} })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
    put: jest.fn(() => Promise.resolve({ data: {} })),
    delete: jest.fn(() => Promise.resolve({ data: {} })),
    create: jest.fn(() => mockAxiosInstance),
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
    defaults: { withCredentials: true, headers: { common: {} } },
  };

  return {
    __esModule: true,
    default: mockAxiosInstance,
    ...mockAxiosInstance,
  };
});

// Polyfill scrollIntoView for JSDOM
window.HTMLElement.prototype.scrollIntoView = jest.fn();

