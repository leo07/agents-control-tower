import { useState, useEffect } from "react";
import { listModels } from "../lib/cursor-api.js";

export function useModels(apiKey: string) {
  const [models, setModels] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listModels(apiKey)
      .then(setModels)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [apiKey]);

  return { models, loading };
}
