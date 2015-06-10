var gulp      = require('gulp')
,   uglify    = require('gulp-uglify')
,   rename    = require('gulp-rename')
,   less      = require('gulp-less')
,   watch     = require('gulp-watch')
,   plumber   = require('gulp-plumber')
,   minifyCss = require('gulp-minify-css');

gulp.task('default', ['uglify', 'less']);

gulp.task('watch', function() {
    watch(['src/js/begard.js', 'src/css/themes/default/style.less'], function() {
        var d = new Date();
        console.log();
        console.log('Generating in ' + d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds());
        gulp.start('default');
    });
});

gulp.task('uglify', function() {
    return gulp.src('src/js/begard.js')
        .pipe(plumber())
        .pipe(uglify())
        .pipe(rename('begard.min.js'))
        .pipe(gulp.dest('dist/js'));
});

gulp.task('less', function() {
    return gulp.src('src/css/themes/default/style.less')
        .pipe(plumber())
        .pipe(less())
        .pipe(minifyCss())
        .pipe(rename('style.min.css'))
        .pipe(gulp.dest('dist/css/themes/default'));
});
