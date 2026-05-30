import { describe, expect, it } from "vitest";
import { extractQuestionMap } from "@/lib/qualtrics/client";
import { sanitizeSurveyFileName } from "@/lib/qualtrics/names";

describe("sanitizeSurveyFileName", () => {
  it("replaces non-alphanumeric characters with underscores", () => {
    expect(sanitizeSurveyFileName("Cultural embodiment (2024)")).toBe(
      "Cultural_embodiment__2024_",
    );
  });
});

describe("extractQuestionMap", () => {
  it("extracts survey questions from metadata", () => {
    const map = extractQuestionMap("SV_test", {
      metadata: {
        SurveyElements: [
          {
            Element: "SQ",
            PrimaryAttribute: "QID1",
            Payload: { QuestionText: "How are you?" },
          },
          { Element: "BL", PrimaryAttribute: "BL_1" },
        ],
      },
    });

    expect(map).toEqual([
      {
        SurveyID: "SV_test",
        Question: "QID1",
        QID: "QID1",
        QuestionText: "How are you?",
      },
    ]);
  });
});
