import { Ionizer } from "./frontend/ionizer.ts";
import { Parser } from "./frontend/parser.ts";
import { createEnv, Enviroment } from "./runtime/enviroment.ts";
import { evaluate } from "./runtime/evaluate.ts";
import { isError, setTest } from "./etc.ts";
import { rgb24 } from "https://deno.land/std@0.200.0/fmt/colors.ts";
import boxen from "npm:boxen";

function main(args: string[]) {
  if (args === undefined || args === null || args.length <= 0) {
    Repl();
  }

  switch (args[0]) {
    case "run?":
      if (args.length < 2) {
        console.log("file to run excepted.");
      }
      const atoms = Deno.readTextFileSync(args[1]).toString();
      console.log(atoms);
      RunTest(atoms);
      break;
  }
}

function Repl() {
  console.log();
  const env: Enviroment = createEnv();
  while (true) {
    console.log("%cAtomic", "color: #c22147");

    const atoms: any = prompt(rgb24("=>", {
      r: 194,
      g: 33,
      b: 71,
    }));
    if (atoms == ".exit") {
      Deno.exit(0);
    }
    const ionizer = new Ionizer(atoms);
    const ionized = ionizer.ionize();

    const parser: Parser = new Parser(ionized);
    const parsed = parser.productAST();

    const run = evaluate(parsed, env);

    console.log(`%c${run.value}`, `color: ${run.color}`);
  }
}
export function RunTest(atoms: string) {
  setTest();
  const env = createEnv();
  const ionizer = new Ionizer(atoms);
  const ionized = ionizer.ionize();
  console.log("%c*******IONIZED:*******", "font-size: larger; color: red");
  console.log(ionized);
  console.log("\n\n\n\n\n\n");

  const parser: Parser = new Parser(ionized);
  const parsed = parser.productAST();
  console.log("%c******PARSED:******", "font-size: larger; color: red");

  console.log(parsed);

  console.log("\n\n\n\n\n\n");

  if (isError) {
    Deno.exit(1);
  }

  const run = evaluate(parsed, env);
  console.log(run);
}
export function Run(atoms: string) {
  const env = createEnv();

  const ionizer = new Ionizer(atoms);
  const ionized = ionizer.ionize();

  const parser = new Parser(ionized);
  const parsed = parser.productAST();

  if (isError) {
    Deno.exit(1);
  }
  const run = evaluate(parsed, env);
}
// Learn more at https://deno.land/manual/examples/module_metadata#concepts
if (import.meta.main) {
  main(Deno.args);
}
