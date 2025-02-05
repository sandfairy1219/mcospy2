Java.perform(() => {
    let javaSystem = Java.use("java.lang.System");
    javaSystem["exit"].implementation = function () {
        console.log("java.lang.System.exit");
    };
    javaSystem["gc"].implementation = function () {
        console.log("java.lang.System.gc");
    };
    let Runtime = Java.use("java.lang.Runtime");
    Runtime["exit"].implementation = function () {
        console.log("java.lang.Runtime.exit");
    };
    let Cocos2dxActivity = Java.use("org.cocos2dx.lib.Cocos2dxActivity");
    Cocos2dxActivity["getCookie"].implementation = function (str:string) {
        let result = this["getCookie"](str);
        console.log("Cocos2dxActivity.getCookie", result);
        return result;
    };
    let XigncodeClientSystem = Java.use("com.wellbia.xigncode.XigncodeClientSystem");
    // XigncodeClientSystem["initialize"].implementation = function (activity:any,str:string,str2:string,str3:string,callback:(...args:any[]) => void) {
    //     console.log("XigncodeClientSystem.initialize", activity, str, str2, str3);
    //     return 0;
    // };
    XigncodeClientSystem["getCookie2"].implementation = function (str:string) {
        let result = this["getCookie2"](str);
        console.log("XigncodeClientSystem.getCookie2", result);
        return result;
    }
    const filter = "Cocos2dxActivity";
    Java.enumerateLoadedClassesSync().forEach(function (className) {
        if (className.indexOf(filter) >= 0) {
            logMethods(Java.use(className));
        };
    })
});

function logMethods(activity:Java.Wrapper, filter?:string) {
    console.log("==========", activity.$className, "==========");
    activity.class.getDeclaredMethods().forEach(function (method:any) {
        if (filter && method.getName().match(new RegExp(filter, "gi")) === null) return;
        console.log(method);
    });
    console.log("\n");
}