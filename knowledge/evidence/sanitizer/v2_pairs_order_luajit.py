from lupa import luajit21
L = luajit21.LuaRuntime()
print(L.eval('jit.version'), L.execute('local t = {}; t.rel = function() end; t.referrerpolicy = "origin"; local o = {}; for k in pairs(t) do o[#o+1] = k end; return table.concat(o, ",")'))
