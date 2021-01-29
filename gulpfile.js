/*
*  © 2020 Shigaev Dmitriy
*
*  Обновленная сборка gulp 2020 года.
*  В связи с обновлением gulp в 2018 году, данная сборка переписана
*  с учетом последних изменений и рекомендаций разработчиков gulp-а
*
*  Задачи переписаны с помощью function т.к. теперь не рекомендуется
*  писать их в виде task.
*
*  Теперь каждую функцию(задачу) нужно экспортировать
*
*  Документация gulp на русском языке https://webdesign-master.ru/blog/docs/gulp-documentation.html
*  Документация gulp на английском https://gulpjs.com/
* */


/*
*  === Файлы и папки ===
*
*  package.json - файл манифеста
*  src - исходники
*  build - готовый собранный проект
*  node_modules - каталог, в котором установлены все общесистемные пакеты npm
* */


/*
*  === Установленные плагины (их также можно посмотреть в package.json в разделе devDependencies) ===
*
*  1) browser-sync: live-reload(перезагрузка страниц в реальном времени). Документация https://browsersync.io/docs
*  2) gulp-concat: объединяет файлы
*  3) gulp-uglify-es: сжимает js в одну строку
*  4) gulp-scss: преобразует scss/scss файлы в css
*  5) gulp-autoprefixer: автоматом проставляет префиксы
*  6) gulp-clean-css: сжимает стили в одну строку
*  7) gulp-less: преобразует less файлы в css
*  8) gulp-imagemin: сжимает фото
*  9) gulp-newer: проверяет, если изображения были уже сжаты, то повторно их сжимать не будет
*  10) del: node.js модуль, очищает директорию
*  11) gulp-sourcemaps: построение встроенных карт (показывает какая строка в каком файле)
*  12) gulp-if: управление потоком
*  13) gulp-rigger: позволяет включать один файл(js/html) в другой
*  14) gulp-htmlmin: сжимает html
*  15) favicons: генерирует фавиконки под разные устройства.
*  16) gulp-mode: определяет режим разработки
* */

/*
*  === Консольные команды ===
*
*  gulp --production : сборка проекта на продакшн(сжатые файлы js/css/img, отсутствует sourcemap)
*  gulp --development : режим разработки (файлы не сжаты, sourcemap присутствует)
* */

'use strict'

let preprocessor = 'scss' // В зависимости от языка меняем на less или scss. Чтобы использовать sass, нужно переименовать папку scss на sass и расширение главного файла на sass. (Предпочтительней использовать scss т.к. scss наиболее удобен в использовании и наболее гибок чем less)

/*
*  === Пути ===
*
*  build - готовый проект для продакшена
*  src - исходники
*  watch - отслеживаемые изменения в файлах
* */
let paths = {
    build: {
        html: 'build',
        css: 'build/css/',
        js: 'build/js/',
        img: 'build/img/',
        fonts: 'build/fonts/',
        pages: 'pages/'
    },
    src: {
        html: 'src/pages/**/*.html',
        // scss: 'src/' + preprocessor + '/main.' + preprocessor + '',
        scss: 'src/scss/**/main.scss',
        js: [
            'node_modules/jquery/dist/jquery.min.js', // необязательно jquery подключать именно так, можно подключить непосредственно в файле main.js
            // 'src/js/main.js'
            'src/**/main.js'
        ],
        img: 'src/img/**/*',
        fonts: 'src/fonts/**/*',
        pages: 'src/pages/pages/**/*.html'
    },
    watch: {
        html: 'src/**/*.html',
        // scss: 'src/' + preprocessor + '/main.' + preprocessor + '',
        scss: 'src/**/*.scss',
        js: 'src/**/*.js',
        img: 'src/img/**/*',
        fonts: 'src/fonts/**/*',
        pages: 'src/pages/pages/**/*.html'
    }
}

// Плагины
const {src, dest, parallel, series, watch} = require('gulp');
const browserSync = require('browser-sync').create();
const concat = require('gulp-concat');
const uglify = require('gulp-uglify-es').default;
const scss = require('gulp-sass');
const less = require('gulp-less');
const autoprefix = require('gulp-autoprefixer');
const cleanCss = require('gulp-clean-css');
const images = require('gulp-imagemin');
const newer = require('gulp-newer');
const del = require('del');
const sourcemap = require('gulp-sourcemaps');
const gulpif = require('gulp-if');
const rigger = require('gulp-rigger');
const htmlmin = require('gulp-htmlmin');
const favicon = require('favicons').stream;
const mode = require('gulp-mode')();

// Папка, запускаемая как сервер browser-sync
function browsersync() {
    browserSync.init({
        // server: ["pages", "build"],
        server: {
            baseDir: "./build",
            index: "index.html",
            // directory: true // показывает все директории приложениея в браузере
        },
        notify: false, // Отключает уведомления browser-sync
        online: true // Работа в локальной сети (есть возможность зайти с мобильного устройства)
    })
}

// Работа с html
function html() {
    return src(paths.src.html)
        .pipe(rigger())
        .pipe(mode.production(htmlmin({collapseWhitespace: true})))
        .pipe(dest(paths.build.html))
        .pipe(browserSync.stream())
}

// Работа с файлами scss/scss/less
function css() {
    return src(paths.src.scss)
        .pipe(eval(preprocessor)())
        .pipe(rigger())
        .pipe(concat('main.min.css'))
        .pipe(mode.development(sourcemap.init()))
        .pipe(mode.production(cleanCss(
            (
                {
                    level:
                        {
                            1: {specialComments: 0}
                        },
                    // format: 'beautify' // Выравнивает код если необходимо
                }
            )
        )))
        .pipe(mode.development(sourcemap.write()))
        .pipe(autoprefix({
            overrideBrowserslist: [
                'last 10 versions' // 10 последних версий браузеров
            ], grid: true // префиксы для grid css
        }))
        .pipe(dest(paths.build.css))
        .pipe(browserSync.stream())
}

// Работа с файлами javascript
function js() {
    return src(paths.src.js)
        .pipe(concat('main.min.js'))
        .pipe(mode.development(sourcemap.init()))
        .pipe(mode.production(uglify()))
        .pipe(mode.development(sourcemap.write()))
        .pipe(dest(paths.build.js))
        .pipe(browserSync.stream())
}

// Работа с изображениями
function img() {
    return src(paths.src.img, {force: true})
        .pipe(newer('build/img'))
        .pipe(images())
        .pipe(dest(paths.build.img))
}

// Очищает папку img
function cleanimg() {
    return del('build/img/**/*')
}

// Генерация фавиконок
function faviconGenerate() {
    return src('src/img/favicon/*.*')
        .pipe(favicon({
            icons: {
                appleIcon: true,
                favicons: true,
                online: false,
                appleStartup: false,
                android: false,
                firefox: false,
                yandex: false,
                windows: false,
                coast: false
            }
        }))
        .pipe(dest('build/img/favicon/'))
        .pipe(browserSync.stream())
}

// Перенос шрифтов
function fonts() {
    return src(paths.src.fonts)
        .pipe(dest(paths.build.fonts))
}

// Очищает папку dist
function cleandist() {
    return del('build/**/*', {force: true})
}

// Отслеживает изменения в исходных файлах
function startWatch() {
    watch([
        paths.watch.js,
        '!src/**/*.min.js'
    ], js)
    watch([
        paths.watch.scss
    ], css)
    watch([
        paths.watch.html
    ], html).on('change', browserSync.reload)
    watch([paths.watch.img], img)
}

exports.browsersync = browsersync
exports.html = html
exports.js = js
exports.css = css
exports.img = img
exports.fonts = fonts
exports.faviconGenerate = faviconGenerate
exports.cleanimg = cleanimg
exports.cleandist = cleandist

exports.default = parallel(cleandist, html, css, js, img, fonts, faviconGenerate, browsersync, startWatch)