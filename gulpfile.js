const gulp = require('gulp');
const path = require('path');
const fs = require('fs');
const rimraf = require('rimraf');
const typescript = require('gulp-typescript');
const sourcemaps = require('gulp-sourcemaps');


// 登録してあるチェインコード
const chaincodes = [
    'Ownership',
    'Room',
    'Trading',
    'User',
];


gulp.task('rm', callback => rimraf('out', callback));

gulp.task('build', ['rm'], () => {

    fs.mkdirSync(path.resolve(__dirname, 'out'));

    const packageBase = fs.readFileSync('chaincode-package-base.json', 'utf-8');

    return chaincodes.map(chaincodeName => {

        const lowercaseName = chaincodeName.toLowerCase();
        const chaincodeDir = path.resolve(__dirname, 'out', lowercaseName);

        // 各チェーンコード用のディレクトリを作成
        fs.mkdirSync(chaincodeDir);

        // 各チェーンコードを実行する用の
        const newPackage = packageBase.replace(/\$\{chaincodeName\}/g, chaincodeName);
        fs.writeFileSync(path.resolve(chaincodeDir, 'package.json'), newPackage);

        const tsProject = typescript.createProject('tsconfig.json');

        return tsProject.src()
            .pipe(sourcemaps.init())
            .pipe(tsProject())
            .js
            .pipe(sourcemaps.write('./'))
            .pipe(gulp.dest(chaincodeDir));
    });
});
