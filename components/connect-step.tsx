"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardTitle } from "@/components/ui/card";
import { PrivacyBanner } from "@/components/privacy-banner";
import { testConnection } from "@/lib/qualtrics/client";
import type { QualtricsCredentials } from "@/lib/qualtrics/types";

interface ConnectStepProps {
  credentials: QualtricsCredentials;
  onChange: (credentials: QualtricsCredentials) => void;
  onConnected: () => void;
}

export function ConnectStep({
  credentials,
  onChange,
  onConnected,
}: ConnectStepProps) {
  const [acknowledged, setAcknowledged] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleTestConnection() {
    setTesting(true);
    setError(null);

    try {
      await testConnection(credentials);
      onConnected();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not connect to Qualtrics. Check your datacenter and token.",
      );
    } finally {
      setTesting(false);
    }
  }

  return (
    <Card className="space-y-5">
      <CardTitle>Connect to Qualtrics</CardTitle>
      <PrivacyBanner />

      <div className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
        <p>
          Qualtrics requires an API token for every backup request. The token
          lets this app read your surveys and export response data on your
          behalf — the same permissions the{" "}
          <a
            href="https://github.com/giladfeldman/qualtrics_backup"
            className="underline underline-offset-2"
            target="_blank"
            rel="noreferrer"
          >
            R backup script
          </a>{" "}
          uses.
        </p>
        <p>
          Find your datacenter ID and token under Account Settings → Qualtrics
          IDs in Qualtrics.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="font-medium">Datacenter ID</span>
          <Input
            placeholder="e.g. syd1, ca1, yul1"
            value={credentials.datacenter}
            onChange={(event) =>
              onChange({ ...credentials, datacenter: event.target.value })
            }
            autoComplete="off"
          />
        </label>
        <label className="space-y-1 text-sm sm:col-span-2">
          <span className="font-medium">API token</span>
          <Input
            type="password"
            placeholder="Paste your Qualtrics API token"
            value={credentials.apiToken}
            onChange={(event) =>
              onChange({ ...credentials, apiToken: event.target.value })
            }
            autoComplete="off"
          />
        </label>
      </div>

      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          className="mt-1"
          checked={acknowledged}
          onChange={(event) => setAcknowledged(event.target.checked)}
        />
        <span>
          I understand this token grants access to my Qualtrics account data. I
          have reviewed the open-source code and trust that this app does not
          store my token.
        </span>
      </label>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </p>
      ) : null}

      <Button
        disabled={
          testing ||
          !acknowledged ||
          !credentials.apiToken.trim() ||
          !credentials.datacenter.trim()
        }
        onClick={handleTestConnection}
      >
        {testing ? "Testing connection…" : "Test connection"}
      </Button>
    </Card>
  );
}
