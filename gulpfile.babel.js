import gulp from 'gulp';
import runSequence from 'run-sequence';
import gulpLoadPlugins from 'gulp-load-plugins';


const $ = gulpLoadPlugins();


gulp.task('styles', () => {
  return gulp.src([
    'css/**/*.scss',
  ])
    .pipe($.sass().on('error', $.sass.logError))
    .pipe($.cleanCss())
    .pipe(gulp.dest('css'));
});


gulp.task('default', done => {
  runSequence(
    'styles',
    done
  );
});