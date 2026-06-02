import type { TaxFormData } from "~/lib/tax/form/types";
import {
  PAY_FREQUENCY_QUERY_PARAM,
  SCENARIO_QUERY_PARAM,
  WITHHELD_PER_PAYCHECK_QUERY_PARAM,
  WITHHOLDING_JOBS_QUERY_PARAM,
} from "~/lib/tax/scenario/keys.constants";
import { serializeScenarioInput } from "~/lib/tax/scenario/serialize";
import { MAX_SCENARIO_URL_LENGTH } from "~/routes/taxHome/taxHomePersistence";
import { DEFAULT_PAY_FREQUENCY, parsePayFrequency } from "~/lib/tax/withholding/payFrequency";
import type { WithholdingInputs, WithholdingJobInput } from "~/lib/tax/withholding/types";
import { loadWithholdingFromLocalStorage } from "~/lib/tax/scenario/scenarioLocalPersistence";
import { mergeWithholdingJobsWithWageJobs, type WageJob } from "~/lib/tax/withholding/wageJobs";

type SerializedJob = {
  id: string;
  pay?: string;
  withheld?: number;
};

function parseSerializedJobs(raw: string | undefined): WithholdingJobInput[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(decodeURIComponent(raw));
    if (!Array.isArray(data)) return [];
    return data
      .filter((entry): entry is SerializedJob => entry && typeof entry.id === "string")
      .map(entry => ({
        incomeRowId: entry.id,
        payFrequency: parsePayFrequency(entry.pay),
        federalWithheldPerPaycheck:
          entry.withheld !== undefined && Number.isFinite(Number(entry.withheld))
            ? Math.max(0, Number(entry.withheld))
            : undefined,
      }));
  } catch {
    return [];
  }
}

/** Read job-level withholding from URL (legacy single `pay`/`withheld` applied to first wage job on merge). */
export function readWithholdingInputsFromSearchParams(
  searchParams: Record<string, string>,
): WithholdingInputs {
  const jobs = parseSerializedJobs(searchParams[WITHHOLDING_JOBS_QUERY_PARAM]);
  if (jobs.length > 0) {
    return { jobs };
  }

  const legacyPay = parsePayFrequency(searchParams[PAY_FREQUENCY_QUERY_PARAM]);
  const legacyWithheldRaw = searchParams[WITHHELD_PER_PAYCHECK_QUERY_PARAM];
  if (legacyWithheldRaw === undefined || legacyWithheldRaw === "") {
    return { jobs: [] };
  }
  const legacyWithheld = Number(legacyWithheldRaw);
  if (!Number.isFinite(legacyWithheld) || legacyWithheld < 0) {
    return { jobs: [] };
  }
  return {
    jobs: [
      {
        incomeRowId: "__legacy__",
        payFrequency: legacyPay,
        federalWithheldPerPaycheck: legacyWithheld,
      },
    ],
  };
}

export function serializeWithholdingJobs(jobs: WithholdingJobInput[]): string {
  const payload: SerializedJob[] = jobs.map(job => ({
    id: job.incomeRowId,
    pay: job.payFrequency,
    ...(job.federalWithheldPerPaycheck !== undefined
      ? { withheld: job.federalWithheldPerPaycheck }
      : {}),
  }));
  return encodeURIComponent(JSON.stringify(payload));
}

export function mergeWithholdingIntoSearchParams(
  current: Record<string, string | string[] | undefined>,
  inputs: WithholdingInputs,
): Record<string, string | string[] | undefined> {
  const next = { ...current };
  if (inputs.jobs.length > 0) {
    next[WITHHOLDING_JOBS_QUERY_PARAM] = serializeWithholdingJobs(inputs.jobs);
  } else {
    delete next[WITHHOLDING_JOBS_QUERY_PARAM];
  }
  delete next[PAY_FREQUENCY_QUERY_PARAM];
  delete next[WITHHELD_PER_PAYCHECK_QUERY_PARAM];
  return next;
}

/** Merge URL/persisted job inputs with current W-2 rows; map legacy entry onto first job. */
export function resolveWithholdingInputsForWageJobs(
  wageJobs: WageJob[],
  stored: WithholdingInputs,
): WithholdingInputs {
  let jobs = stored.jobs.filter(j => j.incomeRowId !== "__legacy__");
  const legacy = stored.jobs.find(j => j.incomeRowId === "__legacy__");
  jobs = mergeWithholdingJobsWithWageJobs(wageJobs, jobs);
  if (legacy && wageJobs.length > 0) {
    const firstId = wageJobs[0]!.incomeRowId;
    jobs = jobs.map(j =>
      j.incomeRowId === firstId
        ? {
            ...j,
            payFrequency: legacy.payFrequency,
            federalWithheldPerPaycheck: legacy.federalWithheldPerPaycheck,
          }
        : j,
    );
  }
  return { jobs };
}

export function defaultJobInput(incomeRowId: string): WithholdingJobInput {
  return { incomeRowId, payFrequency: DEFAULT_PAY_FREQUENCY };
}

/**
 * Share URL for `/withholding` with scenario and optional per-job paycheck settings.
 */
export function hasWithholdingInSearchParams(searchParams: Record<string, string>): boolean {
  return (
    Boolean(searchParams[WITHHOLDING_JOBS_QUERY_PARAM]) ||
    Boolean(searchParams[WITHHELD_PER_PAYCHECK_QUERY_PARAM])
  );
}

export function resolveInitialWithholdingInputs(
  searchParams: Record<string, string>,
  wageJobs: WageJob[],
): WithholdingInputs {
  const stored = hasWithholdingInSearchParams(searchParams)
    ? readWithholdingInputsFromSearchParams(searchParams)
    : (loadWithholdingFromLocalStorage() ?? readWithholdingInputsFromSearchParams(searchParams));
  return resolveWithholdingInputsForWageJobs(wageJobs, stored);
}

export function buildWithholdingShareUrl(
  baseHref: string,
  input: TaxFormData,
  withholding: WithholdingInputs,
): string {
  const url = new URL(baseHref);
  url.pathname = "/withholding";
  url.searchParams.set(SCENARIO_QUERY_PARAM, serializeScenarioInput(input));
  if (withholding.jobs.length > 0) {
    url.searchParams.set(WITHHOLDING_JOBS_QUERY_PARAM, serializeWithholdingJobs(withholding.jobs));
  } else {
    url.searchParams.delete(WITHHOLDING_JOBS_QUERY_PARAM);
  }
  url.searchParams.delete(PAY_FREQUENCY_QUERY_PARAM);
  url.searchParams.delete(WITHHELD_PER_PAYCHECK_QUERY_PARAM);
  if (url.toString().length > MAX_SCENARIO_URL_LENGTH) {
    url.searchParams.delete(SCENARIO_QUERY_PARAM);
    url.searchParams.delete(WITHHOLDING_JOBS_QUERY_PARAM);
  }
  return url.toString();
}
