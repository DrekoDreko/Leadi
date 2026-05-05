import assert from "node:assert/strict";

import {
  complianceBatteryCases,
  type ComplianceBatteryBucket
} from "../src/lib/openai/compliance-battery";
import { reviewTextLocally } from "../src/lib/openai/compliance-guardrails";

type BatteryResult = {
  id: string;
  bucket: ComplianceBatteryBucket;
  label: string;
  actualRisk: "low" | "medium" | "high";
  reasonTitles: string[];
};

function main() {
  const results = complianceBatteryCases.map((testCase) => {
    const review = reviewTextLocally(testCase.text);
    const reasonTitles = review.reasons.map((reason) => reason.title);

    validateBucket(testCase.bucket, review.riskLevel, testCase.label);

    for (const expectedReasonTitle of testCase.expectedReasonTitles ?? []) {
      assert.ok(
        reasonTitles.includes(expectedReasonTitle),
        `${testCase.label}: motivo esperado ausente -> ${expectedReasonTitle}`
      );
    }

    return {
      id: testCase.id,
      bucket: testCase.bucket,
      label: testCase.label,
      actualRisk: review.riskLevel,
      reasonTitles
    } satisfies BatteryResult;
  });

  const summary = summarize(results);

  console.log("Compliance validator battery: OK");
  console.log(
    `Safe=${summary.safe} Questionable=${summary.questionable} Prohibited=${summary.prohibited}`
  );
  console.log("");

  for (const result of results) {
    console.log(`[${result.bucket}] ${result.actualRisk.toUpperCase()} ${result.label}`);
    console.log(`- motivos: ${result.reasonTitles.join(", ")}`);
  }
}

function validateBucket(
  bucket: ComplianceBatteryBucket,
  actualRisk: "low" | "medium" | "high",
  label: string
) {
  if (bucket === "safe") {
    assert.equal(actualRisk, "low", `${label}: caso seguro nao deveria subir risco.`);
    return;
  }

  if (bucket === "questionable") {
    assert.notEqual(actualRisk, "low", `${label}: caso duvidoso escapou sem alerta.`);
    return;
  }

  assert.equal(actualRisk, "high", `${label}: caso proibido deveria ser risco alto.`);
}

function summarize(results: BatteryResult[]) {
  return results.reduce(
    (accumulator, result) => {
      accumulator[result.bucket] += 1;
      return accumulator;
    },
    {
      safe: 0,
      questionable: 0,
      prohibited: 0
    } satisfies Record<ComplianceBatteryBucket, number>
  );
}

main();
