// jest.setup.ts
import "@testing-library/jest-dom";

// Supress React 19 act() warnings in tests
(global as unknown as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
