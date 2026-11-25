import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import fs from "node:fs";
import os from "node:os";
import http from "node:http";
import https from "node:https";
import { spawn, execFile } from "node:child_process";

const ALLOWED_OLLAMA_ENDPOINTS = new Set(["/api/tags", "/api/chat", "/api/generate", "/api/version"]);
const ALLOWED_OLLAMA_DOWNLOAD_HOSTS = new Set([
  "ollama.com",
  "www.ollama.com",
  "github.com",
  "objects.githubusercontent.com",
  "release-assets.githubusercontent.com",
  "github-releases.githubusercontent.com",
]);
const SAFE_OLLAMA_MODEL_NAME_RE = /^[a-zA-Z0-9._/-]+(:[a-zA-Z0-9._-]+)?$/;

function parseSafeOllamaOrigin(rawBaseUrl?: string): URL | null {
  const candidate = typeof rawBaseUrl === "string" && rawBaseUrl.trim() ? rawBaseUrl.trim() : "http://localhost:11434";
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    if (parsed.username || parsed.password) return null;
    const host = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, "");
    if (
      !host ||
      host === "0.0.0.0" ||
      host === "169.254.169.254" ||
      host.startsWith("169.254.") ||
      host.startsWith("fe80:") ||
      host === "metadata.google.internal" ||
      host.endsWith(".internal")
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

async function findLocalOllamaBinary(): Promise<string | null> {
  const candidates: string[] = [];
  if (process.platform === "win32") {
    if (process.env.LOCALAPPDATA) {
      candidates.push(path.join(process.env.LOCALAPPDATA, "Programs", "Ollama", "ollama.exe"));
    }
    if (process.env.PROGRAMFILES) {
      candidates.push(path.join(process.env.PROGRAMFILES, "Ollama", "ollama.exe"));
    }
  } else if (process.platform === "darwin") {
    candidates.push(
      "/usr/local/bin/ollama",
      "/opt/homebrew/bin/ollama",
      "/Applications/Ollama.app/Contents/Resources/ollama"
    );
  } else {
    candidates.push("/usr/local/bin/ollama", "/usr/bin/ollama");
  }

  for (const candidatePath of candidates) {
    try {
      await fs.promises.access(candidatePath, fs.constants.F_OK);
      return candidatePath;
    } catch {
      // continue
    }
  }

  const locatorCmd = process.platform === "win32" ? "where.exe" : "which";
  return new Promise((resolve) => {
    execFile(locatorCmd, ["ollama"], { timeout: 3000, windowsHide: true, shell: false }, (err, stdout) => {
      if (err || !stdout) return resolve(null);
      const firstLine = String(stdout)
        .split(/\r?\n/)
        .map((l) => l.trim())
        .find(Boolean);
      resolve(firstLine || null);
    });
  });
}

function pingOllamaServer(parsedOrigin: URL, timeoutMs = 1500): Promise<boolean> {
  return new Promise((resolve) => {
    const targetUrl = new URL("/api/version", parsedOrigin.origin);
    const client = targetUrl.protocol === "https:" ? https : http;
    const req = client.get(targetUrl, { timeout: timeoutMs }, (res) => {
      res.resume();
      resolve((res.statusCode || 0) >= 200 && (res.statusCode || 0) < 300);
    });
    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });
    req.on("error", () => resolve(false));
  });
}

async function waitForOllamaReady(parsedOrigin: URL, maxAttempts = 20, delayMs = 500): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    if (await pingOllamaServer(parsedOrigin)) return true;
    await new Promise((r) => setTimeout(r, delayMs));
  }
  return false;
}

function downloadOfficialOllamaInstaller(destPath: string, onProgress: (pct: number) => void, maxRedirects = 5): Promise<boolean> {
  const startUrl = "https://ollama.com/download/OllamaSetup.exe";
  const downloadFromUrl = (targetUrl: string, redirectsLeft: number): Promise<boolean> =>
    new Promise((resolve, reject) => {
      let parsed: URL;
      try {
        parsed = new URL(targetUrl);
      } catch {
        return reject(new Error("Invalid installer URL"));
      }
      if (parsed.protocol !== "https:" || !ALLOWED_OLLAMA_DOWNLOAD_HOSTS.has(parsed.hostname.toLowerCase())) {
        return reject(new Error(`Blocked non-allowlisted download host: ${parsed.hostname}`));
      }

      const req = https.get(
        targetUrl,
        {
          headers: { "User-Agent": "Luno-Note/1.0.0" },
          timeout: 30000,
        },
        (res) => {
          const status = res.statusCode || 0;
          if ([301, 302, 303, 307, 308].includes(status) && res.headers.location) {
            res.resume();
            if (redirectsLeft <= 0) {
              return reject(new Error("Too many redirects while downloading Ollama installer"));
            }
            const nextUrl = new URL(res.headers.location, targetUrl).toString();
            downloadFromUrl(nextUrl, redirectsLeft - 1).then(resolve, reject);
            return;
          }
          if (status < 200 || status >= 300) {
            res.resume();
            return reject(new Error(`HTTP ${status} while downloading Ollama installer`));
          }

          const totalBytes = parseInt(String(res.headers["content-length"] || "0"), 10) || 0;
          let receivedBytes = 0;
          let lastPct = -1;
          const fileStream = fs.createWriteStream(destPath);

          res.on("data", (chunk: Buffer) => {
            receivedBytes += chunk.length;
            if (totalBytes > 0) {
              const pct = Math.min(99, Math.round((receivedBytes / totalBytes) * 100));
              if (pct !== lastPct) {
                lastPct = pct;
                onProgress(pct);
              }
            }
          });

          res.pipe(fileStream);
          fileStream.on("finish", () => fileStream.close(() => resolve(true)));
          fileStream.on("error", (err) => {
            req.destroy();
            fs.promises.unlink(destPath).catch(() => {});
            reject(err);
          });
        }
      );

      req.on("timeout", () => req.destroy(new Error("Installer download timed out")));
      req.on("error", (err) => {
        fs.promises.unlink(destPath).catch(() => {});
        reject(err);
      });
    });

  return downloadFromUrl(startUrl, maxRedirects);
}

function lunoOllamaDevPlugin(): Plugin {
  type ProgressItem = {
    stage: "downloading" | "installing" | "starting" | "pulling" | "ready";
    percent?: number;
    model?: string;
    statusText?: string;
  };

  type PullJobState = {
    status: "running" | "done" | "error" | "canceled";
    model: string;
    percent: number;
    error?: string;
    updatedAt: number;
  };

  let latestProgress: ProgressItem | null = null;
  const progressByModel: Record<string, ProgressItem> = {};
  const pullJobStates: Record<string, PullJobState> = {};
  const activePullRequests = new Map<
    string,
    { req: http.ClientRequest | null; canceled: boolean; waitingResolve?: ((ok: boolean) => void) | null }
  >();
  let activeInstallPromise: Promise<{ ok: boolean; error?: string }> | null = null;

  let activeConcurrentStreams = 0;
  const MAX_CONCURRENT_STREAMS = 1;
  const pendingQueue: Array<{
    entry: { canceled: boolean; waitingResolve?: ((ok: boolean) => void) | null };
    resolve: (ok: boolean) => void;
  }> = [];

  const acquireSlot = (entry: { canceled: boolean; waitingResolve?: ((ok: boolean) => void) | null }): Promise<boolean> => {
    if (entry.canceled) return Promise.resolve(false);
    if (activeConcurrentStreams < MAX_CONCURRENT_STREAMS) {
      activeConcurrentStreams++;
      return Promise.resolve(true);
    }
    return new Promise((resolve) => {
      entry.waitingResolve = resolve;
      pendingQueue.push({ entry, resolve });
    });
  };

  const releaseSlot = () => {
    activeConcurrentStreams = Math.max(0, activeConcurrentStreams - 1);
    while (pendingQueue.length > 0 && activeConcurrentStreams < MAX_CONCURRENT_STREAMS) {
      const next = pendingQueue.shift();
      if (!next) break;
      next.entry.waitingResolve = null;
      if (next.entry.canceled) {
        next.resolve(false);
      } else {
        activeConcurrentStreams++;
        next.resolve(true);
      }
    }
  };

  const isTransientPullErr = (errText?: string) => {
    const lower = String(errText || "").toLowerCase();
    return (
      lower.includes("max retries exceeded") ||
      lower.includes("context canceled") ||
      lower.includes("pull_incomplete") ||
      lower.includes("read tcp") ||
      lower.includes("wsarecv") ||
      lower.includes("eof") ||
      lower.includes("timeout") ||
      lower.includes("etimedout") ||
      lower.includes("stalled") ||
      lower.includes("reset") ||
      lower.includes("connection") ||
      lower.includes("tls") ||
      lower.includes("temporary") ||
      lower.includes("pull_failed")
    );
  };

  const startBackgroundPullJob = (parsedOrigin: URL, modelName: string) => {
    const existingEntry = activePullRequests.get(modelName);
    if (existingEntry && !existingEntry.canceled && pullJobStates[modelName]?.status === "running") {
      return;
    }

    const pullEntry: {
      req: http.ClientRequest | null;
      canceled: boolean;
      waitingResolve?: ((ok: boolean) => void) | null;
    } = { req: null, canceled: false, waitingResolve: null };
    activePullRequests.set(modelName, pullEntry);
    const initProg: ProgressItem = { stage: "pulling", model: modelName, percent: 0 };
    progressByModel[modelName] = initProg;
    pullJobStates[modelName] = {
      status: "running",
      model: modelName,
      percent: 0,
      updatedAt: Date.now(),
    };

    void (async () => {
      const gotSlot = await acquireSlot(pullEntry);
      if (!gotSlot || pullEntry.canceled) {
        activePullRequests.delete(modelName);
        delete progressByModel[modelName];
        pullJobStates[modelName] = {
          status: "canceled",
          model: modelName,
          percent: 0,
          error: "CANCELED",
          updatedAt: Date.now(),
        };
        return;
      }

      const targetUrl = new URL("/api/pull", parsedOrigin.origin);
      const client = targetUrl.protocol === "https:" ? https : http;
      const payloadStr = JSON.stringify({ model: modelName, stream: true });

      let maxPercent = 0;
      const layerTotals = new Map<string, number>();
      const layerCompleted = new Map<string, number>();

      const runSinglePull = (): Promise<{ ok: boolean; model?: string; canceled?: boolean; error?: string }> =>
        new Promise((resolve) => {
          if (pullEntry.canceled) {
            return resolve({ ok: false, canceled: true, error: "CANCELED" });
          }
          let settled = false;
          let stallTimer: ReturnType<typeof setTimeout> | null = null;
          const clearWatchdog = () => {
            if (stallTimer) {
              clearTimeout(stallTimer);
              stallTimer = null;
            }
          };
          const done = (result: { ok: boolean; model?: string; canceled?: boolean; error?: string }) => {
            if (settled) return;
            settled = true;
            clearWatchdog();
            resolve(result);
          };

          let lastByteAdvanceAt = Date.now();
          let lastSumCompleted = -1;

          const pullReq = client.request(
            targetUrl,
            {
              method: "POST",
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(payloadStr, "utf8"),
              },
              timeout: 30 * 60 * 1000,
            },
            (pullRes) => {
              const status = pullRes.statusCode || 0;
              if (status < 200 || status >= 300) {
                pullRes.resume();
                return done({ ok: false, error: `HTTP ${status}` });
              }

              let buffer = "";
              let pullError: string | null = null;
              let sawSuccessStatus = false;

              const processLine = (line: string) => {
                if (pullEntry.canceled) return;
                const trimmed = line.trim();
                if (!trimmed) return;
                try {
                  const obj = JSON.parse(trimmed);
                  if (obj.error) {
                    pullError = String(obj.error);
                    return;
                  }
                  const statusStr = typeof obj.status === "string" ? obj.status : "";
                  if (statusStr === "success") {
                    sawSuccessStatus = true;
                  }
                  if (statusStr.includes("verifying") || statusStr.includes("writing") || statusStr === "success") {
                    lastByteAdvanceAt = Date.now();
                  }
                  if (typeof obj.total === "number" && obj.total > 0 && typeof obj.completed === "number") {
                    const key = typeof obj.digest === "string" && obj.digest ? obj.digest : "__default__";
                    layerTotals.set(key, obj.total);
                    layerCompleted.set(key, Math.min(obj.total, obj.completed));

                    let sumTotal = 0;
                    let sumCompleted = 0;
                    for (const [k, tot] of layerTotals.entries()) {
                      sumTotal += tot;
                      sumCompleted += layerCompleted.get(k) || 0;
                    }

                    if (sumCompleted > lastSumCompleted) {
                      lastSumCompleted = sumCompleted;
                      lastByteAdvanceAt = Date.now();
                    }

                    const rawPct = sumTotal > 0 ? Math.min(99, Math.round((sumCompleted / sumTotal) * 100)) : 0;
                    const pct = Math.max(maxPercent, rawPct);
                    maxPercent = pct;
                    progressByModel[modelName] = {
                      stage: "pulling",
                      model: modelName,
                      percent: pct,
                      statusText: statusStr,
                    };
                    pullJobStates[modelName] = {
                      status: "running",
                      model: modelName,
                      percent: pct,
                      updatedAt: Date.now(),
                    };
                  }
                } catch {
                  /* ignore */
                }
              };

              pullRes.on("data", (chunk: Buffer) => {
                if (pullEntry.canceled) return;
                buffer += chunk.toString("utf8");
                const lines = buffer.split("\n");
                buffer = lines.pop() || "";
                for (const line of lines) processLine(line);
              });

              pullRes.on("end", () => {
                if (pullEntry.canceled) {
                  return done({ ok: false, canceled: true, error: "CANCELED" });
                }
                if (buffer.trim()) processLine(buffer);
                if (pullError) {
                  done({ ok: false, error: pullError });
                } else if (!sawSuccessStatus) {
                  done({ ok: false, error: "PULL_INCOMPLETE_EOF" });
                } else {
                  done({ ok: true, model: modelName });
                }
              });

              pullRes.on("close", () => {
                if (pullEntry.canceled) {
                  done({ ok: false, canceled: true, error: "CANCELED" });
                } else if (!settled) {
                  done({ ok: false, error: "PULL_INCOMPLETE_EOF" });
                }
              });
            }
          );

          pullEntry.req = pullReq;

          const checkStall = () => {
            if (settled || pullEntry.canceled) return;
            if (Date.now() - lastByteAdvanceAt >= 180000) {
              try {
                pullReq.destroy(new Error("STALLED_STREAM"));
              } catch {
                /* ignore */
              }
              done({ ok: false, error: "STALLED_STREAM" });
              return;
            }
            stallTimer = setTimeout(checkStall, 5000);
          };
          stallTimer = setTimeout(checkStall, 5000);

          pullReq.on("timeout", () => pullReq.destroy(new Error("ETIMEDOUT")));
          pullReq.on("error", (err) => {
            if (pullEntry.canceled || err?.message === "CANCELED") {
              done({ ok: false, canceled: true, error: "CANCELED" });
            } else {
              done({ ok: false, error: err?.message || "PULL_FAILED" });
            }
          });
          pullReq.write(payloadStr);
          pullReq.end();
        });

      const MAX_ATTEMPTS = 60;
      let finalRes: { ok: boolean; model?: string; canceled?: boolean; error?: string } = {
        ok: false,
        error: "PULL_FAILED",
      };
      try {
        for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
          if (pullEntry.canceled) {
            finalRes = { ok: false, canceled: true, error: "CANCELED" };
            break;
          }
          if (!(await pingOllamaServer(parsedOrigin))) {
            const binPath = await findLocalOllamaBinary();
            if (binPath) {
              try {
                const child = spawn(binPath, ["serve"], {
                  detached: true,
                  stdio: "ignore",
                  windowsHide: true,
                  shell: false,
                });
                child.on("error", () => {});
                child.unref();
                await waitForOllamaReady(parsedOrigin, 20, 500);
              } catch {
                /* ignore */
              }
            }
          }
          finalRes = await runSinglePull();
          if (finalRes.ok || finalRes.canceled || pullEntry.canceled) {
            break;
          }
          if (!isTransientPullErr(finalRes.error) || attempt === MAX_ATTEMPTS) {
            break;
          }
          await new Promise((r) => setTimeout(r, 3000));
        }
      } finally {
        releaseSlot();
        activePullRequests.delete(modelName);
        delete progressByModel[modelName];
        if (finalRes.ok) {
          pullJobStates[modelName] = {
            status: "done",
            model: modelName,
            percent: 100,
            updatedAt: Date.now(),
          };
        } else if (finalRes.canceled || pullEntry.canceled) {
          pullJobStates[modelName] = {
            status: "canceled",
            model: modelName,
            percent: maxPercent,
            error: "CANCELED",
            updatedAt: Date.now(),
          };
        } else {
          pullJobStates[modelName] = {
            status: "error",
            model: modelName,
            percent: maxPercent,
            error: finalRes.error || "PULL_FAILED",
            updatedAt: Date.now(),
          };
        }
      }
    })();
  };

  const readJsonBody = (req: http.IncomingMessage): Promise<Record<string, unknown>> =>
    new Promise((resolve) => {
      const chunks: Buffer[] = [];
      let total = 0;
      req.on("data", (c: Buffer) => {
        total += c.length;
        if (total <= 5 * 1024 * 1024) chunks.push(c);
      });
      req.on("end", () => {
        try {
          const text = Buffer.concat(chunks).toString("utf8");
          resolve(text ? JSON.parse(text) : {});
        } catch {
          resolve({});
        }
      });
      req.on("error", () => resolve({}));
    });

  const sendJson = (res: http.ServerResponse, status: number, payload: unknown) => {
    res.statusCode = status;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(payload));
  };

  return {
    name: "luno-ollama-dev-middleware",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const urlPath = (req.url || "").split("?")[0];
        if (!urlPath.startsWith("/__luno_ollama/")) return next();

        if (urlPath === "/__luno_ollama/progress" && req.method === "GET") {
          return sendJson(res, 200, { progress: latestProgress, models: progressByModel, jobs: pullJobStates });
        }

        if (urlPath === "/__luno_ollama/check" && req.method === "GET") {
          const binPath = await findLocalOllamaBinary();
          return sendJson(res, 200, { installed: Boolean(binPath), platform: process.platform });
        }

        if (urlPath === "/__luno_ollama/install" && req.method === "POST") {
          const body = await readJsonBody(req);
          const parsedOrigin = parseSafeOllamaOrigin(typeof body?.baseUrl === "string" ? body.baseUrl : undefined);
          if (!parsedOrigin) {
            return sendJson(res, 400, { ok: false, error: "INVALID_URL" });
          }

          if (!activeInstallPromise) {
            activeInstallPromise = (async () => {
              let binPath = await findLocalOllamaBinary();
              if (!binPath) {
                if (process.platform !== "win32") {
                  return { ok: false, error: "MANUAL_INSTALL_REQUIRED" };
                }
                const tempInstallerPath = path.join(os.tmpdir(), `LunoOllamaSetup-${Date.now()}.exe`);
                try {
                  latestProgress = { stage: "downloading", percent: 0 };
                  await downloadOfficialOllamaInstaller(tempInstallerPath, (percent) => {
                    latestProgress = { stage: "downloading", percent };
                  });
                  latestProgress = { stage: "installing", percent: 100 };
                  await new Promise<boolean>((resolve, reject) => {
                    const installer = spawn(tempInstallerPath, ["/VERYSILENT", "/NORESTART"], {
                      windowsHide: true,
                      shell: false,
                    });
                    installer.on("error", reject);
                    installer.on("close", (code) => {
                      if (code === 0) resolve(true);
                      else reject(new Error(`Installer exited with code ${code}`));
                    });
                  });
                } catch (err: unknown) {
                  return { ok: false, error: err instanceof Error ? err.message : "INSTALL_FAILED" };
                } finally {
                  fs.promises.unlink(tempInstallerPath).catch(() => {});
                }
                binPath = await findLocalOllamaBinary();
              }

              latestProgress = { stage: "starting", percent: 100 };
              if (await pingOllamaServer(parsedOrigin)) {
                return { ok: true };
              }
              if (binPath) {
                try {
                  const child = spawn(binPath, ["serve"], {
                    detached: true,
                    stdio: "ignore",
                    windowsHide: true,
                    shell: false,
                  });
                  child.on("error", () => {});
                  child.unref();
                } catch {
                  /* ignore */
                }
              }
              const ready = await waitForOllamaReady(parsedOrigin, 20, 500);
              return ready ? { ok: true } : { ok: false, error: "START_FAILED" };
            })();
          }

          try {
            const installResult = await activeInstallPromise;
            return sendJson(res, installResult.ok ? 200 : 500, installResult);
          } finally {
            latestProgress = null;
            activeInstallPromise = null;
          }
        }

        if (urlPath === "/__luno_ollama/pull" && req.method === "POST") {
          const body = await readJsonBody(req);
          const modelName = typeof body?.model === "string" ? body.model.trim() : "";
          if (!modelName || !SAFE_OLLAMA_MODEL_NAME_RE.test(modelName)) {
            return sendJson(res, 400, { ok: false, error: "INVALID_MODEL_NAME" });
          }
          const parsedOrigin = parseSafeOllamaOrigin(typeof body?.baseUrl === "string" ? body.baseUrl : undefined);
          if (!parsedOrigin) {
            return sendJson(res, 400, { ok: false, error: "INVALID_URL" });
          }

          startBackgroundPullJob(parsedOrigin, modelName);
          return sendJson(res, 200, { ok: true, asyncJob: true, model: modelName });
        }

        if (urlPath === "/__luno_ollama/cancel" && req.method === "POST") {
          const body = await readJsonBody(req);
          const modelName = typeof body?.model === "string" ? body.model.trim() : "";
          if (!modelName) {
            return sendJson(res, 400, { ok: false, error: "INVALID_MODEL_NAME" });
          }
          const entry = activePullRequests.get(modelName);
          if (entry) {
            entry.canceled = true;
            activePullRequests.delete(modelName);
            delete progressByModel[modelName];
            pullJobStates[modelName] = {
              status: "canceled",
              model: modelName,
              percent: 0,
              error: "CANCELED",
              updatedAt: Date.now(),
            };
            if (typeof entry.waitingResolve === "function") {
              const wake = entry.waitingResolve;
              entry.waitingResolve = null;
              wake(false);
            }
            try {
              entry.req?.destroy(new Error("CANCELED"));
            } catch {
              /* ignore */
            }
          }
          return sendJson(res, 200, { ok: true, canceled: true });
        }

        if (urlPath === "/__luno_ollama/delete" && req.method === "POST") {
          const body = await readJsonBody(req);
          const modelName = typeof body?.model === "string" ? body.model.trim() : "";
          if (!modelName || !SAFE_OLLAMA_MODEL_NAME_RE.test(modelName)) {
            return sendJson(res, 400, { ok: false, error: "INVALID_MODEL_NAME" });
          }
          const parsedOrigin = parseSafeOllamaOrigin(typeof body?.baseUrl === "string" ? body.baseUrl : undefined);
          if (!parsedOrigin) {
            return sendJson(res, 400, { ok: false, error: "INVALID_URL" });
          }
          const targetUrl = new URL("/api/delete", parsedOrigin.origin);
          const client = targetUrl.protocol === "https:" ? https : http;
          const payloadStr = JSON.stringify({ model: modelName, name: modelName });

          await new Promise<void>((resolve) => {
            const delReq = client.request(
              targetUrl,
              {
                method: "DELETE",
                headers: {
                  Accept: "application/json",
                  "Content-Type": "application/json",
                  "Content-Length": Buffer.byteLength(payloadStr, "utf8"),
                },
                timeout: 15000,
              },
              (delRes) => {
                const status = delRes.statusCode || 0;
                const chunks: Buffer[] = [];
                delRes.on("data", (c: Buffer) => chunks.push(c));
                delRes.on("end", () => {
                  if (status >= 200 && status < 300) {
                    sendJson(res, 200, { ok: true });
                  } else {
                    const rawText = Buffer.concat(chunks).toString("utf8");
                    sendJson(res, status || 500, { ok: false, error: rawText || `HTTP ${status}` });
                  }
                  resolve();
                });
              }
            );
            delReq.on("timeout", () => delReq.destroy(new Error("ETIMEDOUT")));
            delReq.on("error", (err) => {
              sendJson(res, 500, { ok: false, error: err?.message || "DELETE_FAILED" });
              resolve();
            });
            delReq.write(payloadStr);
            delReq.end();
          });
          return;
        }

        if ((urlPath === "/__luno_ollama/request" || urlPath === "/__luno_ollama/stream") && req.method === "POST") {
          const isStreamingRoute = urlPath === "/__luno_ollama/stream";
          const payload = await readJsonBody(req);
          const endpoint = typeof payload?.endpoint === "string" ? payload.endpoint.trim() : "";
          if (!ALLOWED_OLLAMA_ENDPOINTS.has(endpoint)) {
            return sendJson(res, 400, { ok: false, status: 400, error: "Invalid Ollama endpoint" });
          }
          const parsedOrigin = parseSafeOllamaOrigin(typeof payload?.baseUrl === "string" ? payload.baseUrl : undefined);
          if (!parsedOrigin) {
            return sendJson(res, 400, { ok: false, status: 400, error: "Invalid or blocked Ollama server URL" });
          }
          const isPost = endpoint === "/api/chat" || endpoint === "/api/generate";
          const method = isPost ? "POST" : "GET";
          const payloadBody =
            payload?.body && typeof payload.body === "object" ? (payload.body as Record<string, unknown>) : null;
          const isAssembledStreamChat =
            endpoint === "/api/chat" && payloadBody !== null && payloadBody.stream !== true;
          const forceStream = isStreamingRoute && endpoint === "/api/chat";
          const outboundBody =
            isPost && payloadBody !== null
              ? isAssembledStreamChat || forceStream
                ? { ...payloadBody, stream: true }
                : payloadBody
              : null;
          const bodyString = outboundBody ? JSON.stringify(outboundBody) : null;
          const rawTimeout = Number(payload?.timeoutMs);
          const timeoutMs =
            Number.isFinite(rawTimeout) && rawTimeout >= 1000 && rawTimeout <= 600000
              ? rawTimeout
              : isPost
              ? 300000
              : 6000;
          const targetUrl = new URL(endpoint, parsedOrigin.origin);
          const client = targetUrl.protocol === "https:" ? https : http;

          if (isStreamingRoute) {
            res.writeHead(200, {
              "Content-Type": "application/x-ndjson; charset=utf-8",
              "Cache-Control": "no-cache, no-transform",
              Connection: "keep-alive",
              "X-Accel-Buffering": "no",
            });
            res.flushHeaders?.();
          }

          await new Promise<void>((resolve) => {
            let clientClosed = false;
            const finishRoute = () => resolve();
            const headers: Record<string, string | number> = { Accept: "application/json" };
            if (bodyString !== null) {
              headers["Content-Type"] = "application/json";
              headers["Content-Length"] = Buffer.byteLength(bodyString, "utf8");
            }
            const proxyReq = client.request(
              targetUrl,
              { method, headers, timeout: timeoutMs },
              (proxyRes) => {
                const status = proxyRes.statusCode || 0;
                if (status >= 300 && status < 400) {
                  proxyRes.resume();
                  if (isStreamingRoute) {
                    if (!res.writableEnded) {
                      res.write(JSON.stringify({ error: "Redirects are not allowed for Ollama requests", status }) + "\n");
                      res.end();
                    }
                  } else {
                    sendJson(res, 200, { ok: false, status, error: "Redirects are not allowed for Ollama requests" });
                  }
                  return finishRoute();
                }

                if ((isAssembledStreamChat || forceStream) && status >= 200 && status < 300) {
                  let buffer = "";
                  let assembledContent = "";
                  let lastMeta: Record<string, unknown> | null = null;
                  let streamError: string | null = null;

                  const handleLine = (line: string) => {
                    if (clientClosed) return;
                    const trimmed = line.trim();
                    if (!trimmed) return;
                    try {
                      const obj = JSON.parse(trimmed);
                      if (obj.error) {
                        streamError = String(obj.error);
                        return;
                      }
                      const delta =
                        typeof obj?.message?.content === "string"
                          ? obj.message.content
                          : typeof obj?.response === "string"
                          ? obj.response
                          : "";
                      if (delta) {
                        assembledContent += delta;
                        if (isStreamingRoute && !res.writableEnded) {
                          res.write(
                            JSON.stringify({
                              delta,
                              ...(typeof obj?.model === "string" ? { model: obj.model } : {}),
                            }) + "\n"
                          );
                        }
                      }
                      lastMeta = obj;
                    } catch {
                      /* ignore */
                    }
                  };

                  proxyRes.on("data", (c: Buffer) => {
                    if (clientClosed) return;
                    buffer += c.toString("utf8");
                    const lines = buffer.split("\n");
                    buffer = lines.pop() || "";
                    for (const line of lines) handleLine(line);
                  });

                  proxyRes.on("end", () => {
                    if (clientClosed) return finishRoute();
                    if (buffer.trim()) handleLine(buffer);
                    if (isStreamingRoute) {
                      if (!res.writableEnded) {
                        if (streamError) {
                          res.write(JSON.stringify({ error: streamError, status: 500 }) + "\n");
                        } else {
                          res.write(
                            JSON.stringify({
                              done: true,
                              ...(typeof lastMeta?.model === "string" ? { model: lastMeta.model } : {}),
                              content: assembledContent,
                            }) + "\n"
                          );
                        }
                        res.end();
                      }
                    } else if (streamError) {
                      sendJson(res, 200, { ok: false, status: 500, error: streamError });
                    } else {
                      sendJson(res, 200, {
                        ok: true,
                        status,
                        data: {
                          ...(lastMeta && typeof lastMeta === "object" ? lastMeta : {}),
                          message: { role: "assistant", content: assembledContent },
                          done: true,
                        },
                      });
                    }
                    finishRoute();
                  });
                  return;
                }

                const chunks: Buffer[] = [];
                proxyRes.on("data", (c: Buffer) => chunks.push(c));
                proxyRes.on("end", () => {
                  if (clientClosed) return finishRoute();
                  const rawText = Buffer.concat(chunks).toString("utf8");
                  let parsedData: unknown = null;
                  try {
                    parsedData = rawText ? JSON.parse(rawText) : null;
                  } catch {
                    parsedData = rawText;
                  }
                  const parsedRec =
                    parsedData && typeof parsedData === "object" ? (parsedData as Record<string, unknown>) : null;
                  const parsedMsg =
                    parsedRec?.message && typeof parsedRec.message === "object"
                      ? (parsedRec.message as Record<string, unknown>)
                      : null;
                  if (status >= 200 && status < 300) {
                    if (isStreamingRoute) {
                      if (!res.writableEnded) {
                        const finalText =
                          (typeof parsedMsg?.content === "string" && parsedMsg.content) ||
                          (typeof parsedRec?.response === "string" && parsedRec.response) ||
                          "";
                        res.write(
                          JSON.stringify({
                            done: true,
                            content: finalText,
                          }) + "\n"
                        );
                        res.end();
                      }
                    } else {
                      sendJson(res, 200, { ok: true, status, data: parsedData });
                    }
                  } else {
                    const errMsg = (parsedRec && parsedRec.error) || `HTTP ${status}`;
                    if (isStreamingRoute) {
                      if (!res.writableEnded) {
                        res.write(JSON.stringify({ error: String(errMsg), status }) + "\n");
                        res.end();
                      }
                    } else {
                      sendJson(res, 200, { ok: false, status, error: String(errMsg), data: parsedData });
                    }
                  }
                  finishRoute();
                });
              }
            );

            req.on("close", () => {
              if (!res.writableEnded) {
                clientClosed = true;
                try {
                  proxyReq.destroy(new Error("ABORTED"));
                } catch {
                  /* ignore */
                }
                finishRoute();
              }
            });
            proxyReq.on("timeout", () => proxyReq.destroy(new Error("ETIMEDOUT")));
            proxyReq.on("error", (err) => {
              if (clientClosed) return finishRoute();
              if (isStreamingRoute) {
                if (!res.writableEnded) {
                  res.write(JSON.stringify({ error: err?.message || "Connection failed", status: 0 }) + "\n");
                  res.end();
                }
              } else {
                sendJson(res, 200, { ok: false, status: 0, error: err?.message || "Connection failed" });
              }
              finishRoute();
            });
            if (bodyString !== null) proxyReq.write(bodyString);
            proxyReq.end();
          });
          return;
        }

        return next();
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: "./",
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), lunoOllamaDevPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("@tabler/icons-react")) return "tabler-icons";
            if (id.includes("@phosphor-icons/react")) return "phosphor-icons";
            if (id.includes("lucide-react")) return "lucide-icons";
            if (id.includes("@tiptap") || id.includes("prosemirror")) return "tiptap";
            if (id.includes("@radix-ui")) return "radix-ui";
            if (id.includes("framer-motion")) return "framer-motion";
            if (id.includes("lowlight") || id.includes("highlight.js")) return "highlight";
            return "vendor";
          }
        },
      },
    },
  },
}));

