const unzipper = require('unzipper');
const fs = require('fs/promises');
const {existsSync} = require('fs');
const path = require('path');
const parse = require('@fast-csv/parse');
const dayjs = require('dayjs');


const dataPath = path.join(__dirname, 'data');

const unzip = async () => {
    const exists = existsSync(dataPath);
    if (!exists) {
        await fs.mkdir(dataPath)

    }
    const zip = await unzipper.Open.file('data.zip');
    for (const file of zip.files) {
        const buffer = await file.buffer();
        await fs.writeFile(path.join(dataPath, file.path), buffer)
    }
}

const parseFile = async () => {
    const files = await fs.readdir(dataPath);
    const result = [];
    for (const file of files) {
        const newVar = await parse.parseFile(path.join(dataPath, file), {headers: true, delimiter: '|'});
        for await (const item of newVar) {
            item.person = {firstName: item.first_name, lastName: item.last_name}
            item.phone = item.phone.split('').filter(value => Number.isInteger(+value) && value !== ' ').join('')
            item.constCenterNum = item.cc.substr(3)
            const [day, month, year] = item.date.split('/')
            item.date = dayjs(new Date(year, month, day)).format('YYYY-MM-DD')
            item.amount = +item.amount
            for (let key in item) {
                if (!['name', 'phone', 'person', 'amount', 'date', "constCenterNum"].includes(key)) {
                    delete item[key]
                }
            }
            result.push(item)
        }
    }
    return result;
}
const save = async (data) => {
    await fs.writeFile(path.join(dataPath, 'res.json'), JSON.stringify(data))
}

const start = async () => {
    try {
        await unzip()
        const data = await parseFile();
        await save(data);


    } catch (e) {
        console.log(e);
    }
}

start().then()
