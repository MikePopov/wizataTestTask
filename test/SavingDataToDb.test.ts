import {main} from "../main";
import chaiHttp from "chai-http";
import { expect } from "chai";
import {app} from "../src/app";
import chai from "chai"
import exp from "constants";


chai.use(chaiHttp);
chai.should();
chai.use(require('chai-like'));
chai.use(require('chai-things'));

const positiveTestData = [
  {
    HardwareId: 'TEST_TEST_1',
    SensorValue: 20
  },
  {
    HardwareId: 'TEST_TEST_2',
    SensorValue: -1
  },{
    HardwareId: 'TEST_TEST_3',
    SensorValue: 0
  },{
    HardwareId: 'TEST_TEST_4',
    SensorValue: 12.3
  },{
    HardwareId: 'TEST_TEST_5',
    SensorValue: 2.3e-5
  }
];


describe('Data from which was send to Event Hub should correctly saved in InfluxDb',  () => {
  let date = new Date().toISOString();

  positiveTestData.forEach(event => {
    before(async () => {
      // await chai.request(app)
      //      .get('/delete');

      await main(date, event.HardwareId, event.SensorValue);
    });

    // it(`all data samples should be saved in DB`, (done) => {
    //   chai.request(app)
    //     .get('/')
    //     .end((err, res) => {
    //       res.should.have.status(200);
    //       // expect(res.body).to.deep.include( {
    //       //     time: date,
    //       //     sensorId: `${event.HardwareId}_mult`,
    //       //     value: event.SensorValue*2
    //       //   }
    //       // );
    //
    //       console.log(res.body);
    //       done();
    //     });
    // });

    it(`sensorID = ${event.HardwareId} should saved correctly`,(done) => {
      chai.request(app)
        .get('/')
        .end((err, res) => {
          expect(res.body.map(e=>(e.sensorId))).to.include(`${event.HardwareId}_mult`);
          //console.log(res.body);
          done();
        });
    });

    it(`sensor value = ${event.SensorValue} should multiply on 2 = ${event.SensorValue*2} saved correctly`,(done) => {
      chai.request(app)
        .get('/')
        .end((err, res) => {
          expect(res.body.map(e=>(e.value))).to.include(event.SensorValue*2);
          //console.log(res.body);
          done();
        });
    });

    it(`Time = ${date} should saved correctly`,(done) => {
      chai.request(app)
        .get('/')
        .end((err, res) => {
          expect(res.body.map(e=>(e.time))).to.include(date);
          //console.log(res.body);
          done();
        });
    });

  });

  it(`order of data samples should be the same as was send to Event hub`, (done) => {
    chai.request(app)
      .get('/')
      .end((err, res) => {
        for (let i = 0; i < positiveTestData.length; i++){
          expect(res.body[i]).to.have.deep.property('sensorId', `${positiveTestData[i].HardwareId}_mult`);
        }
        done();
      });
  });

  after(async () => {
    console.log('Clean DB...');
    await chai.request(app)
      .get('/delete')
  });

});

describe('Equal data samples with different timestamps', () => {
  let date1 = new Date ();
  let date2 = new Date ( date1 );
  date2.setMinutes( date1.getMinutes() + 1 );

  const testData = [
    {
      Timestamp​: date1.toISOString(),
      HardwareId: 'TEST_TEST_1',
      SensorValue: 6
    },
    {
      Timestamp​: date2.toISOString(),
      HardwareId: 'TEST_TEST_1',
      SensorValue: 6
    }
  ];

  testData.forEach(event => {
    before(async function () {
      // console.log(date1.toISOString());
      // console.log(date2.toISOString());
      await main(event.Timestamp, event.HardwareId, event.SensorValue);
    });

    it('should saved correctly', (done) => {
      chai.request(app)
        .get('/')
        .end((err, res) => {
          expect(res.body).to.deep.include( {
              time: event.Timestamp,
              sensorId: `${event.HardwareId}_mult`,
              value: event.SensorValue*2
            }
          );
          done();
        });
    });

    after(async () => {
      console.log('Clean DB...');
      await chai.request(app)
        .get('/delete')
    });
  })
})