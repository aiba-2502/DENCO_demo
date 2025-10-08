"use client";

import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-[calc(100vh-theme(spacing.16))] flex-col items-center justify-center gap-2">
      <h2 className="text-2xl font-bold">エラーが発生しました</h2>
      <p className="text-muted-foreground">ページの読み込み中にエラーが発生しました。</p>
      <Button
        onClick={() => reset()}
        className="mt-4 gap-2"
      >
        <RefreshCcw className="h-4 w-4" />
        再試行
      </Button>
    </div>
  );
}