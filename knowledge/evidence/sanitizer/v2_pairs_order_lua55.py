from lupa import LuaRuntime
import sys
L = LuaRuntime()
print(L.eval('jit and jit.version or _VERSION'), L.execute('local t = {}; t.rel = function() end; t.referrerpolicy = "origin"; local o = {}; for k in pairs(t) do o[#o+1] = k end; return table.concat(o, ",")'))
