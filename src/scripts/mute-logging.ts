"cut";
// Mute logging & analytics at entry point to eliminate main-thread bottleneck,
// disk I/O, and network queue buildup during local stress testing.
// Activated via config toggle "mute-logging".

Java.perform(function () {

    // 1. android.util.Log — all levels
    var Log = Java.use("android.util.Log");
    ["v", "d", "i", "w", "e", "wtf"].forEach(function (level) {
        try {
            Log[level].overload("java.lang.String", "java.lang.String")
                .implementation = function () { return 0; };
        } catch (e) {}
        try {
            Log[level].overload("java.lang.String", "java.lang.String", "java.lang.Throwable")
                .implementation = function () { return 0; };
        } catch (e) {}
    });

    // 2. Firebase Analytics — logEvent (blocks before SQLite write)
    try {
        var FirebaseAnalytics = Java.use("com.google.firebase.analytics.FirebaseAnalytics");
        FirebaseAnalytics.logEvent.overload("java.lang.String", "android.os.Bundle")
            .implementation = function () {};
    } catch (e) {}

    // 3. Firebase Crashlytics — log / recordException / setCustomKey
    try {
        var Crashlytics = Java.use("com.google.firebase.crashlytics.FirebaseCrashlytics");
        Crashlytics.log.overload("java.lang.String").implementation = function () {};
        Crashlytics.recordException.overload("java.lang.Throwable").implementation = function () {};
        try {
            Crashlytics.setCustomKey.overload("java.lang.String", "java.lang.String")
                .implementation = function () {};
        } catch (e) {}
    } catch (e) {}

    // 4. Generic class scan — mute logEvent/submit/track/log/send/enqueue/write
    //    on classes matching Logger/Analytics/Tracker/Reporting
    var targetMethods = ["logEvent", "submit", "track", "log", "send", "enqueue", "write"];
    var classPatterns = ["Logger", "Analytics", "Tracker", "Reporting"];

    Java.enumerateLoadedClasses({
        onMatch: function (className: string) {
            var matched = classPatterns.some(function (p) {
                return className.indexOf(p) !== -1;
            });
            if (!matched) return;
            try {
                var clz = Java.use(className);
                targetMethods.forEach(function (name) {
                    if (!clz[name]) return;
                    clz[name].overloads.forEach(function (overload: any) {
                        overload.implementation = function (): any { return undefined; };
                    });
                });
            } catch (e) {}
        },
        onComplete: function () {}
    });

    // 5. SQLite — block INSERT into log/analytics/event/report tables
    try {
        var SQLiteDatabase = Java.use("android.database.sqlite.SQLiteDatabase");

        var origInsert = SQLiteDatabase.insert;
        origInsert.implementation = function (table: any, nullColHack: any, values: any) {
            var t = table ? table.toLowerCase() : "";
            if (t.indexOf("log") !== -1 || t.indexOf("analytics") !== -1
                || t.indexOf("event") !== -1 || t.indexOf("report") !== -1) {
                return -1;
            }
            return origInsert.call(this, table, nullColHack, values);
        };

        SQLiteDatabase.execSQL.overload("java.lang.String")
            .implementation = function (sql: any) {
                var s = sql.toLowerCase();
                if (s.indexOf("insert") !== -1 &&
                    (s.indexOf("log") !== -1 || s.indexOf("analytics") !== -1
                     || s.indexOf("event") !== -1)) {
                    return;
                }
                this.execSQL(sql);
            };
    } catch (e) {}

    // 6. SharedPreferences — block analytics/tracking keys
    try {
        var Editor = Java.use("android.content.SharedPreferences$Editor");
        var origPut = Editor.putString;
        origPut.implementation = function (key: any, value: any) {
            var k = key ? key.toLowerCase() : "";
            if (k.indexOf("analytics") !== -1 || k.indexOf("log_") !== -1
                || k.indexOf("tracking") !== -1) {
                return this;
            }
            return origPut.call(this, key, value);
        };
    } catch (e) {}
});
