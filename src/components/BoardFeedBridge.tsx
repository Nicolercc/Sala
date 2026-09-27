"use client";

import { BoardDisplay } from "@/components/BoardDisplay";
import { getBoardFeed } from "@/feeds/board";
import { useNow, usePatients } from "@/store/patients";

export function BoardFeedBridge() {
  const { patients } = usePatients();
  const now = useNow();
  return <BoardDisplay feed={getBoardFeed(patients, now)} />;
}
