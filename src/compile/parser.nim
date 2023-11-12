import AST
import parser_def
import parse_expr
import tokenize
import options

#proc mk_scope*(Type: ScopeType, parent: Option[Scope]): Scope =
 # return Scope(parent: parent, Type: Type)

proc make_parser*(src: string): Parser =
  var parser = Parser(line: 1, colmun: 0, tokenizer: make_tokenizer(src))
  parser.last_token = parser.tokenizer.next()
  #parser.current_scope = mk_scope(ScopeType.top, none(Scope))
  return parser

proc productAST*(this: var Parser): Prog =
  var body: seq[Expr] = @[]
  while this.at().tok != TType.EOF: 
    echo "get at", this.at()
    body.add(this.parse_expr())
  return Make_Prog(body, this.line, this.colmun)
