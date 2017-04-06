var gulp = require('gulp'),
    notify = require('gulp-notify'),
    sass = require('gulp-sass'),
    base64 = require('gulp-base64'),
    changed = require('gulp-changed'),
    autoprefixer = require('gulp-autoprefixer'),
    minifycss = require('gulp-minify-css'),
    sourcemaps = require('gulp-sourcemaps'),
    browserSync = require('browser-sync').create(),
    rename = require('gulp-rename'),
    del = require('del'),
    fileinclude = require('gulp-file-include'),
    pathg = require("path"),
    filter = require('gulp-filter'),
    imagemin = require('gulp-imagemin'),
    cache = require("gulp-cache"),
    htmlbeautify = require("gulp-html-beautify"),
    babel = require("gulp-babel"),
    // gulpCopy = require('gulp-copy'),
    // imageminJpegRecompress = require('imagemin-jpeg-recompress'),
    // imageminOptipng = require('imagemin-optipng'),
    tinypng = require('gulp-tinypng-compress'),
    imgfilter = require("./lib").imgfilter,
    filefs = require("fs"),
    compile = require("./lib").compile;
var reload = browserSync.reload;

function taskCss(path) {
    var destpath = pathg.resolve(path, '../').replace("src", "dest");
    var destpath2 = pathg.relative(destpath, __dirname + "/cssmap");
    return gulp.src(path)
        .pipe(autoprefixer({
            browsers: ['last 5 versions', 'Android >= 2.3'],
            cascade: false,
            remove: false
        }))
        .pipe(base64({
            maxImageSize: 5 * 1024,
        }))
        .pipe(sourcemaps.init({
            loadMaps: true,
            identityMap: true
        }))
        .pipe(sass().on('error', sass.logError))
        .pipe(minifycss())
        .pipe(sourcemaps.write(destpath2))
        .pipe(gulp.dest(destpath + "/"))
        .pipe(reload({
            stream: true
        }));
}


function taskHtml(path) {
    var destpath = path.replace(/src/g, "dest");
    var index = destpath.lastIndexOf("\\");
    if (index < 0)
        index = destpath.lastIndexOf("\/");
    destpath = destpath.substring(0, index);
    console.log(destpath);
    return gulp.src(path).pipe(fileinclude({
        prefix: '@@',
        basepath: '@file'
    }))
        .pipe(htmlbeautify({
            indentSize: 2
        }))
        .pipe(gulp.dest(destpath)).pipe(reload({
            stream: true
        }));
}

function taskJs(path) {
    return gulp.src(path)
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(gulp.dest("./dest/js")).pipe(reload({
            stream: true
        }));
}

function taskImg(path) {
    // var jpgmin = imageminJpegRecompress({
    //         accurate: true,//高精度模式
    //         quality: "high",//图像质量:low, medium, high and veryhigh;
    //         method: "smallfry",//网格优化:mpe, ssim, ms-ssim and smallfry;
    //         min: 70,//最低质量
    //         loops: 0,//循环尝试次数, 默认为6;
    //         progressive: false,//基线优化
    //         subsample: "default"//子采样:default, disable;
    //     }),
    //     pngmin = imageminOptipng({
    //         optimizationLevel: 4
    //     });
    var index = path.lastIndexOf("\\");
    if (index < 0)
        index = path.lastIndexOf("\/");
    var destpath = path.substring(0, index).replace(/src/, "dest");
    return gulp.src(path)
        // .pipe(imagemin({
        //     use: [jpgmin, pngmin]
        // }))
        .pipe(tinypng({
            key: 'PAGuOXnbzlRyALDcTN2JWCqgE5xH4Apn',
            sigFile: 'images/.tinypng-sigs',
            log: true
        })).on('error', function (err) {
            console.error(err.message);
        })
        .pipe(gulp.dest(destpath))
}


function taskImg1() {
    imgfilter('src/images/', 'dest/images/', function (r1, r2) {
        var path1 = [];
        var path2 = [];
        for (var i = 0; i < r1.length; i++) {
            var temp1 = r1[i]["path"] + r1[i]["filename"];
            path1.push(temp1)
        }
        for (var i = 0; i < r2.length; i++) {
            var temp2 = r2[i]["path"] + r2[i]["filename"];
            path2.push(temp2)
        }
        // console.log(path1);
        // console.log(path2);
        del(path1);
        return gulp.src(path2)
            .pipe(gulpCopy("dest/", {
                prefix: 1
            }))
    })
}
function taskimgmin(path) {
    var index = path.lastIndexOf("\\");
    var destpath = path.substring(0, index);
    return gulp.src(path)
        .pipe(imagemin())
        .pipe(gulp.dest(destpath))
}

function autoRefresh(path) {
    return gulp.src(path).pipe(reload({
        stream: true
    }));
}


function isFolder(path) {
    var index = path.lastIndexOf("\\");
    var pathg = path.substring(index);
    if (pathg.indexOf(".") >= 0)
        return "file";
    else
        return "folder";
}

gulp.task('sass', function () {
    return gulp.src('src/css/**/transact20170314xyy.scss')
        .pipe(autoprefixer({
            browsers: ['last 5 versions', 'Android >= 2.3'],
            cascade: false,
            remove: false
        }))
        .pipe(base64({
            maxImageSize: 1 * 1024,
        }))
        .pipe(sourcemaps.init({
            loadMaps: true
        }))
        .pipe(sass().on('error', sass.logError))
        .pipe(minifycss())
        .pipe(sourcemaps.write("cssmap/"))
        .pipe(gulp.dest("dest/css"))
});

gulp.task('img', function () {
    del(["dest/images/**/*"]);
    return gulp.src('src/images/**/*.{png,jpg,gif,ico}')
        .pipe(cache(imagemin({
            progressive: true,
            svgoPlugins: [{
                removeViewBox: false
            }]
        })))
        .pipe(gulp.dest('dest/images'));
});

gulp.task('server', function () {
    return browserSync.init({
        notify: false,
        server: {
            baseDir: "./"
        },
        port: 3000
    })
})

function fsExistsSync(path) {
    try {
        filefs.accessSync(path, filefs.F_OK);
    } catch (e) {
        return false;
    }
    return true;
}

gulp.task('watch', function () {
    gulp.watch('src/css/**/*.scss', function (event) {
        if (event.type == "deleted") {
            var destpath = event.path;
            destpath = destpath.replace(/src/g, "dest");
            destpath = destpath.replace(/scss/g, "css");
            del([destpath]);
            return;
        }
        taskCss(event.path);
    })
    gulp.watch(['src/page/**/*.html'], function (event) {
        if (event.type == "deleted") {
            var destpath = event.path.replace(/src/, "dest");
            del([destpath]);
            return;
        }
        taskHtml(event.path);
    })
    gulp.watch(['src/js/**/*.js'], function (event) {
        if (event.type == "deleted") {
            var destpath = event.path.replace(/src/, "dest");
            del([destpath]);
            return;
        }
        taskJs(event.path);
    })
    gulp.watch(['dest/**/*'], function (event) {
        autoRefresh(event.path);
    })
    gulp.watch(['src/images/**/*.{png,jpg,gif,ico}'], function (event) {
        if (event.type == "deleted") {
            var destpath = event.path.replace(/src/, "dest");
            var isExistg = fsExistsSync(destpath);
            if (isExistg) {
                setTimeout(function () {
                    del([destpath]);
                }, 500)
            }
            return;
        }
        var filetype = isFolder(event.path);
        if (filetype == "file")
            taskImg(event.path);
    })
    //  gulp.watch(['src/images/**/*'], function(event) {
    //     taskImg1();
    // })
    // gulp.watch(['dest/images/**/*.{png,jpg,gif,ico}'], function(event) {
    //     var filetype=isFolder(event.path);
    //     if (event.type == "added"&&filetype=="file")
    //         taskimgmin(event.path);
    // })
    return gulp.watch(['src/component/**/*'], function (event) {
        compile(event.path, function (resultArray, type) {
            setTimeout(function () {
                if (resultArray.length > 0) {
                    if (type == 0) {
                        for (var i = 0; i < resultArray.length; i++) {
                            var pathd = resultArray[i].replace(/\//g, "\\");
                            pathd = pathg.resolve(__dirname, pathd);
                            taskHtml(pathd);
                        }
                    } else {
                        for (var i = 0; i < resultArray.length; i++) {
                            var pathd = resultArray[i].replace(/\//g, "\\");
                            pathd = pathg.resolve(__dirname, pathd);
                            taskCss(pathd);
                        }
                    }
                }
            }, 500)
        });
    })
})



gulp.task('default', ['watch', 'server'])
