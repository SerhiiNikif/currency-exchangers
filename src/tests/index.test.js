const chai = require('chai');
const chaiHttp = require('chai-http');
const fs = require('fs');
const app = require('../app');
const sequelizeSetup = require('../config/sequelizeSetup.js');
const { ExchangeOffice, Exchange, Rate, Country } = require('../models');

chai.use(chaiHttp);
const { expect } = chai;

describe('Exchange', () => {
    let testFile;
    let wrongFile;

    before(async () => {
        await sequelizeSetup.authenticate();
        await sequelizeSetup.sync();
        await resetDatabase();
    });

    after(async () => {
        await resetDatabase();
    });

    beforeEach(() => {
        testFile = fs.createReadStream('./src/tests/mocks/data.mock.txt');
        wrongFile = fs.createReadStream('./src/tests/mocks/wrong-data.mock.txt');
    });

    const resetDatabase = async () => {
        await Exchange.destroy({ truncate: true, restartIdentity: true });
        await Rate.destroy({ truncate: true, restartIdentity: true });
        await Country.destroy({ truncate: true, restartIdentity: true });
        await ExchangeOffice.destroy({ where: {} });
        await sequelizeSetup.query('ALTER SEQUENCE "exchange_offices_id_seq" RESTART WITH 1');
    };

    describe('INSERT DATA', async () => {
        it('it should insert data to DB', async () => {
            const httpResponse = await chai.request(app)
                .post('/api/insert-data')
                .attach('dataFile', testFile, 'data.mock.txt');

            expect(httpResponse.status).to.equal(201);
            expect(httpResponse.body).to.deep.equal({message: 'Data successfully inserted'});
        });

        it('it should return a status code 404', async () => {
            const httpResponse = await chai.request(app).post(`/api/wrong`);
            expect(httpResponse.status).to.equal(404);
            expect(httpResponse.body).to.deep.equal({message: 'Not found'});
        });

        it('it should return a status code 400', async () => {
            const httpResponse = await chai.request(app).post('/api/insert-data')
            expect(httpResponse.status).to.equal(400);
            expect(httpResponse.body).to.deep.equal({message: 'No file uploaded'});
        });

        it('it should return a status code 422', async () => {
            const httpResponse = await chai.request(app)
                .post('/api/insert-data')
                .attach('dataFile', wrongFile, 'wrongData.mock.mock.txt');
            expect(httpResponse.status).to.equal(422);
            expect(httpResponse.body).to.deep.equal({message: 'The file format is incorrect'});
        });
    });

    describe('GET PROFIT', async () => {
        it('it should return the top currency exchangers for each country', async () => {
            const httpResponse = await chai.request(app).get('/api/profitable-exchanges');
            expect(httpResponse.status).to.equal(200);
        });

        it('it should return a status code 404', async () => {
            const httpResponse = await chai.request(app).get(`/api/wrong`);
            expect(httpResponse.status).to.equal(404);
            expect(httpResponse.body).to.deep.equal({message: 'Not found'});
        });
    });
});