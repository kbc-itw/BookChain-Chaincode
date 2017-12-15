import 'mocha';
import { expect } from 'chai';
import * as validate from './validate';

describe('validators', () => {

    const invalidData = [
        '',
        'dog',
        '<script>window.alert("unsafe")</script>',
        'SELECT * from users;',
        'I\r\nhave\r\na\r\npen.',
        'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        '🍣'
    ];

    it('UUID', () => {

        expect( validate.uuid( '83022881-e0f9-4e37-b762-682791aa518d' ) )
            .to.be.true;

        invalidData.map(str => validate.uuid(str))
            .forEach(result => expect(result).to.be.false);

    });

    it('FQDN', () => {

        expect( validate.fqdn( 'www.google.com' ) )
            .to.be.true;

        expect( validate.fqdn( 'javascript' ) )
            .to.be.false;

        invalidData.map(str => validate.isbn13(str))
            .forEach(result => expect(result).to.be.false);

    });

    it('ISBN', () => {

        expect( validate.isbn13('007') )
            .to.be.false;

        expect( validate.isbn13('9784274068560') )
            .to.be.true;

        invalidData.map(str => validate.isbn13(str))
            .forEach(result => expect(result).to.be.false);

    });

    it('DateTime', () => {

        expect( validate.datetime( new Date().toISOString() ) )
            .to.be.true;

        expect( validate.datetime('2017-12-12T06:30:44.427Z') )
            .to.be.true;

        invalidData.map(str => validate.datetime(str))
            .forEach(result => expect(result).to.be.false);

    });

    it('User.LocalID', () => {

        expect( validate.user.localId('') )
            .to.be.false;

        expect( validate.user.localId('ほげもげ') )
            .to.be.false;

        invalidData.map(str => validate.user.localId(str))
            .forEach(result => expect(result).to.be.false);

    });

});
