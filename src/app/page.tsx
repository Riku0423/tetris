import { ComponentsStylishTetrisGame } from "@/components/components-stylish-tetris-game";
import Image from "next/image";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-between p-24">
      <ComponentsStylishTetrisGame />
    </div>
  );
}
