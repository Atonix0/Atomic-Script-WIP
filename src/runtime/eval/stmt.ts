import { FnVal, MK_NULL, ReturnVal, RuntimeVal } from "../values.ts";
import { error, evaluate } from "../evaluate.ts";
import {
  FuncCreation,
  ReturnStmt,
  VarCreation,
  UseStmt
} from "../../frontend/AST/stmts.ts";
import { Enviroment } from "../enviroment.ts";
import { green } from "https://deno.land/std@0.200.0/fmt/colors.ts";
import { eval_env } from "./eval_enviroment.ts";
import { Ionizer } from "../../frontend/ionizer.ts";
import { Parser } from "../../frontend/parser.ts";
import { setPath, currentPath } from "../../etc.ts";
import * as path from "https://deno.land/std@0.188.0/path/mod.ts";

export function eval_var_creation(
  stmt: VarCreation,
  env: Enviroment,
): RuntimeVal {
  let value: RuntimeVal = evaluate(stmt.value, env);

  return env.declareVar(stmt.name, value, stmt.isLocked, stmt);
}

export function eval_func_creation(
  stmt: FuncCreation,
  env: Enviroment,
): RuntimeVal {
  let func = {
    type: "func",
    name: stmt.name,
    parameters: stmt.parameters,
    body: stmt.body,
    env,
  } as FnVal;
  func.value = green(JSON.stringify(func));


  return env.declareVar(
    stmt.name,
    func,
    true,
    stmt,
  );
}

export function eval_return_stmt(
  stmt: ReturnStmt,
  env: Enviroment,
): RuntimeVal {
  let value = evaluate(stmt.value, env);

  return {
    type: "return",
    value,
  } as ReturnVal;
}
export function eval_use_stmt(
  stmt: UseStmt,
  env: Enviroment
) : RuntimeVal {
  
  let atoms = "";
  let prev = currentPath;

  atoms = Deno.readTextFileSync(stmt.path);
  Deno.chdir(path.dirname(stmt.path));
  setPath(stmt.path);
  
  let envToAdd = eval_env(new Parser(new Ionizer(atoms).ionize()).productAST());

  env.addEnv(envToAdd);
  Deno.chdir(prev);
  setPath(prev);

  return MK_NULL();
}
