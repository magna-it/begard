var gulp   = require('gulp')
,   uglify = require('gulp-uglify')
,   csso   = require('gulp-csso')
,   rename = require('gulp-rename');

gulp.task('default', ['uglify', 'csso']);

gulp.task('uglify', function() {
    return gulp.src('src/js/begard.js')
        .pipe(uglify())
        .pipe(rename('begard.min.js'))
        .pipe(gulp.dest('dist/js'));
});

gulp.task('csso', function() {
    return gulp.src('src/css/themes/default/style.css')
        .pipe(csso())
        .pipe(rename('style.min.css'))
        .pipe(gulp.dest('dist/css/themes/default'));
});
