import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/i18n/provider", () => ({
  useI18n: () => ({
    t: (key: string) =>
      (
        ({
          "vocabulary.chooseMeaning": "Choose the meaning",
        }) as Record<string, string>
      )[key] ?? key,
  }),
}));

import { MeaningChoice } from "./meaning-choice";

describe("MeaningChoice", () => {
  it("renders the English word above the Chinese choices", () => {
    const html = renderToStaticMarkup(
      <MeaningChoice
        prompt="available"
        options={["可获得的；有空的", "放弃；抛弃", "维持；保持"]}
        selectedAnswer=""
        correctAnswer=""
        feedbackState="answering"
        disabled={false}
        onSelect={() => undefined}
      />
    );

    expect(html).toContain("available");
    expect(html).toContain("可获得的；有空的");
    expect(html).toContain("Choose the meaning");
  });
});
