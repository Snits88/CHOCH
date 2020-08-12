const gulp = require('gulp'),
    webserver = require('gulp-server-io'),
    preprocess = require('gulp-preprocess'),
    minify_html = require('gulp-htmlmin'),
    zip = require('gulp-zip'),
    shell = require('gulp-shell'),
    terser = require('gulp-terser-js')
    ;

var DEBUG = true;
const srcDir = 'src';
const buildDir = 'build';
const getDistDir = () => DEBUG ? "dist_debug" : "dist_release";
const shaderMinifier = 'mono /home/kostik/soft/shader_minifier.exe';

gulp.task('set_prod', cb => {
    DEBUG = false;
    cb()
});

gulp.task('copy_all', () => {
    return gulp.src(srcDir + '/**/*')
        .pipe(gulp.dest(buildDir));
});

gulp.task('minify_glsl', () => {
    return gulp.src(srcDir + '/glsl/*', { read: false })
        .pipe(shell([`${shaderMinifier} --format none --preserve-externals <%= file.path %> -o ${buildDir}/glsl/<%= file.basename %>`]))
});

gulp.task('preprocess', () => {
    return gulp.src(buildDir + '/js/*')
        .pipe(preprocess({
            context: DEBUG ? { DEBUG: true } : {},
        }))
        .pipe(gulp.dest(buildDir + '/js'));
});

gulp.task('minify_js', () => {
    return gulp.src(buildDir + '/js/main.js')
        .pipe(terser({
            mangle: {
                toplevel: true
            }
        }))
        .pipe(gulp.dest(buildDir + '/js'));
});

gulp.task('include_html', () => {
    return gulp.src(buildDir + '/index.html')
        .pipe(preprocess({
            context: DEBUG ? { DEBUG: true } : {},
        }))
        .pipe(gulp.dest(buildDir));
});

gulp.task('minify_html', () => {
    return gulp.src(buildDir + '/index.html')
        .pipe(minify_html({
            collapseWhitespace: true
        }))
        .pipe(gulp.dest(buildDir));
});

gulp.task('zip', () => {
    return gulp.src(buildDir + '/index.html')
        .pipe(zip('dist.zip'))
        .pipe(gulp.dest(buildDir));
});

gulp.task('copy_dist', () => {
    return gulp.src(buildDir + '/index.html')
        .pipe(gulp.dest(getDistDir()));
});

gulp.task('build_debug', gulp.series(
    'copy_all',
    'preprocess',
    'include_html',
    'copy_dist'
));

gulp.task('build_release', gulp.series(
    'set_prod',
    'copy_all',
    'minify_glsl',
    'preprocess',
    'minify_js',
    'include_html',
    'minify_html',
    'zip'
));

gulp.task('serve', () => {
    return gulp.src(getDistDir())
        .pipe(webserver({
            debugger: {
                enable: false
            }
        }));
});

gulp.task('watch', () => {
    gulp.watch(srcDir, gulp.series('build_debug'));
});

gulp.task('run_debug', gulp.series('build_debug', 'serve', 'watch'));

gulp.task('default', gulp.series('run_debug'));