import * as VT from "../values.ts";
import * as AST from "../../frontend/AST/exprs.ts";
import * as ASTV from "../../frontend/AST/values.ts";
import { evaluate } from "../evaluate.ts";
import { Expr, Stmt } from "../../frontend/AST/stmts.ts";
import { Enviroment } from "../enviroment.ts";
import { RuntimeVal, MK_NULL } from "../values.ts";
import { error } from "../evaluate.ts";



export function eval_assign_expr(expr: AST.AssignExpr, env: Enviroment) {
  if(expr.assigne.type === "Id") { 
    let name = (expr.assigne as ASTV.Id).symbol;
    return env.setVar(name, evaluate(expr.value, env), expr);
  }
  
  else if(expr.assigne.type === "MemberExpr") {
    let memberExpr: AST.MemberExpr = expr.assigne as AST.MemberExpr;
    let obj = evaluate(memberExpr.obj, env);
    function eval_assigne_member_expr(obj: RuntimeVal, expr: AST.MemberExpr, value: Expr) : RuntimeVal {
      

      if(obj.type != "obj") {
        error(`excepted an obj in MemberExpr`, "AT3007", expr);
        return MK_NULL();
      }
      if(expr.isIndexed) {
        if(expr.property.type != "Num") {
          error("excepted index of num in indexed MemberExpr", "AT3008", expr);
          return MK_NULL();
        }
        return env.setObjProperty(obj as VT.ObjVal, "null",evaluate(value, env),expr, (expr.property as ASTV.Num).value)
      }


     if(expr.property.type == "MemberExpr") {
        return eval_assigne_member_expr(evaluate(expr.obj, env),expr, value);
     }


     if(memberExpr.property.type == "Id") {
        return env.setObjProperty(obj as VT.ObjVal, (memberExpr.property as ASTV.Id).symbol, evaluate(value,env), expr);
     }
     return MK_NULL();
  }
  return eval_assigne_member_expr(obj, memberExpr, expr.value);
 }
 else {
   error("excepted id(var name) to assinge in assingement expr", "AT3004", expr);
   return MK_NULL();
 }
}


export function eval_object(expr: ASTV.Object, env: Enviroment) : RuntimeVal {
  let properties: Map<string, RuntimeVal> = new Map();

  for(let property of expr.properties) {
    let value: RuntimeVal;
    if(property.value === null) {
      value = env.findVar(property.key, property);
    }
    else {
      value = evaluate(property.value, env);
    }
    properties.set(property.key, value);
  }
  
  return {
    type: "obj",
    value: properties,
    color: "yellow"
  } as VT.ObjVal;  
}



export function eval_binary_expr(expr: AST.BinaryExpr, env: Enviroment) : VT.RuntimeVal {
  const lhs: VT.RuntimeVal = evaluate(expr.left, env); const rhs: VT.RuntimeVal = evaluate(expr.right, env);
  switch(expr.ooperator) {
    case "+":
      return eval_plus_binary_expr(lhs, rhs, expr.left);
    case "-":
      return eval_minus_binary_expr(lhs,rhs, expr);
    case "*":
      return eval_multy_binary_expr(lhs, rhs, expr);
    case "/":
      return eval_divide_binary_expr(lhs, rhs, expr);
    default:
      return MK_NULL();
  }
}

export function eval_plus_binary_expr(lhs: RuntimeVal, rhs: RuntimeVal, expr: Expr) : VT.RuntimeVal {
  if(lhs.type === "str" || rhs.type === "str") {
    return VT.MK_STR(lhs.value + rhs.value);
  }
  else if(rhs.type === "num" && lhs.type === "num") {
    return VT.MK_NUM(lhs.value + rhs.value);
  }
  else {
    error(`cannot beform ooperation plus on right hand of type:${rhs.type} && left hand of type:${lhs.type}`, "AT3003", expr);
    return MK_NULL();
  }
}

export function eval_minus_binary_expr(lhs: RuntimeVal, rhs: RuntimeVal, expr: Expr) {
  if(lhs.type === "num" && rhs.type === "num") {
    return VT.MK_NUM(lhs.value - rhs.value);
  }
  else if(lhs.type === "str") {
    return VT.MK_STR((lhs as VT.StrVal).value.replace(rhs.value, ""));
  }
  else {
    error(`cannot beform ooperation minus on left hand of type:${lhs.type}, right hand of type:${rhs.type}`, "AT3003", expr);
    return MK_NULL();
  }
}

export function eval_multy_binary_expr(lhs: RuntimeVal, rhs: RuntimeVal,expr: Expr) : RuntimeVal {
  if(lhs.type === "num" && rhs.type === "num") {
    return VT.MK_NUM(lhs.value * rhs.value);
  }
  else {
    error(`cannot beform ooperation multiply on left hand of type:${lhs.type}, right hand of type:${rhs.type}`, "AT3003", expr);
    return MK_NULL();
  }
}
export function eval_divide_binary_expr(lhs: RuntimeVal, rhs: RuntimeVal, expr: Expr) {
  if(lhs.type === "num" && rhs.type === "num") {
    if(rhs.value === 0) {
      // TODO add a warning here
      return VT.MK_NUM(0);
    }
    return VT.MK_NUM(rhs.value / lhs.value);
  }
  else {
    error(`cannot beform ooperation divide on left hand of type:${lhs.type} && right hand of type:${rhs.type}`, "AT3003", expr);
    return MK_NULL();
  }
}




export function eval_call_expr(expr: AST.CallExpr, env: Enviroment) : RuntimeVal {
  let args: RuntimeVal[] = [];
  for(let arg of expr.args) {
    args.push(evaluate(arg, env));
  }
  let results: RuntimeVal = MK_NULL(); 
  let fn = evaluate(expr.caller, env);
  switch(fn.type) {
    case "func":
      let func = (fn as VT.FnVal);
      results = MK_NULL();
      let funcEnv = new Enviroment(func.env)
      
      if(args.length != func.parameters.length) {
        error(`excepted ${func.parameters.length} of args got ${args.length}`, "AT3011", expr)
        return MK_NULL();
      }

      for(let x = 0; func.parameters.length > x; x++) {
        funcEnv.declareVar(func.parameters[x], args[x], false, expr);
      }
      
      let last: RuntimeVal;
      for(let stmt of func.body) { 
        last = evaluate(stmt, funcEnv);
        if(last.type === "return") {
          results = (last as VT.ReturnVal).value;
          break;
        }
      }
      return results;
    case "native-func": 
      results = (fn as VT.NativeFnVal).call(args, env);
      return results;
    default:
      error("cannot call a value that is not a function","AT3010", expr);
      return MK_NULL();
  }
}




export function eval_member_expr(expr: AST.MemberExpr, env: Enviroment) : RuntimeVal {
   let obj = evaluate(expr.obj, env);

   if(obj.type != "obj") {
     error(`excepted an obj in MemberExpr`, "AT3007", expr);
     return MK_NULL();
   }
   if(expr.isIndexed) {
     if(expr.property.type != "Num") {
       error("excepted index of num in indexed MemberExpr", "AT3007", expr);
       return MK_NULL();
     }
      return env.getObjProperty(obj as VT.ObjVal, "null",expr, (expr.property as ASTV.Num).value)
   }


   if(expr.property.type == "MemberExpr") {
     return eval_member_expr(expr, env);
   }


   if(expr.property.type == "Id") {
     return env.getObjProperty(obj as VT.ObjVal, (expr.property as ASTV.Id).symbol, expr);
   }
   
   return MK_NULL();
}
