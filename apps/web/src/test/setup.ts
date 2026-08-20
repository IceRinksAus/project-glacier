import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

class MockMediaStream {
  getTracks() {
    return [];
  }
}

Object.defineProperty(globalThis, "MediaStream", {
  value: MockMediaStream,
  configurable: true,
});

afterEach(() => cleanup());
