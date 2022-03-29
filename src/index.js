
const {v4: uuidv4} = require("uuid")
const express = require('express');
const res = require("express/lib/response");

const app = express();

app.use(express.json())

const customers = [];

//MIDDLEWARE
/**
 * Reponsável por verificar se existem cpf já cadastrado
 * Se existir continua com a requisição
 * Se não existir ele aponta error 400
 */
function verifyIfExistsAccountCpf(request, response, next){
    const {cpf} = request.headers;
    const customer = customers.find((customer)=> customer.cpf === cpf);

    if(!customer){
        return response.status(400).json({error: "Customer not found"});
    }

    request.customer = customer;

    return next();
}

function getBalance(statement){
    // console.log(statement)
    //pegar as informações e transformar em um valor somente
    const balance = statement.reduce((acc, operation) => {
        if(operation.type === 'credit'){
            return acc + operation.amount;
        }else{
            return acc - operation.amount;
        }
    }, 0)

    return balance;
}

/**
 * cpf - string
 * name - string
 * id - uuid
 * statement []
 */

app.post("/account", (request, response) => {
    const {cpf, name} = request.body;

    const customerAlreadyExists = customers.some(
        (customer)=> customer.cpf === cpf
    );

    if(customerAlreadyExists){
        return response.status(400).json(
            {error:"Customer already exists!"}
        );
    }

    customers.push({
        cpf,
        name,
        id: uuidv4(),
        statement: []
    });

    return response.status(201).send();

})

// app.use(verifyIfExistsAccountCpf);

app.get("/statement", verifyIfExistsAccountCpf, (request, response) => {
    const {customer} = request;
    return response.json(customer.statement)
})

app.post("/deposit", verifyIfExistsAccountCpf, (request, response) => {
    //receber os valors de descrição e valor
    const {description, amount} = request.body;

    //customer = usuario
    const {customer} = request;

    //operação de status do usuario
    const statementOperation = {
        description,
        amount,
        created_at: new Date(),
        type: "credit"
    }

    //adicionando status do usuário
    customer.statement.push(statementOperation);

    //retornando status de ok
    return response.status(201).send();
})

app.post("/withdraw", verifyIfExistsAccountCpf ,(request, response) => {
    const {amount} = request.body;
    const {customer} = request;

    const balance = getBalance(customer.statement);

    if(balance < amount){
        return response.status(400).json({error: "Insufficient funds!"})
    }

    const statementOperation = {
        amount,
        created_at: new Date(),
        type: "debit"
    }

    customer.statement.push(statementOperation)

    return response.status(201).send()

})

app.get("/statement/date", verifyIfExistsAccountCpf, (request, response) => {
    const {customer} = request;
    const {date} = request.query;

    const dateFormat = new Date(date + " 00:00");

    //10/10/2021
    //buscar uma data no formato passado
    const statement = customer.statement.filter((statement) => statement.created_at.toDateString() === new Date(dateFormat).toDateString())

    return response.json(statement)
})

app.put("/accuont", verifyIfExistsAccountCpf, (request, response) => {
    const {name} = request.body;
    const {customer} = request;

    customer.name = name;

    return response.status(201).send()
})

app.get("/accuont", verifyIfExistsAccountCpf, (request, response) => {
    const {customer} = request;

    return response.json(customer)
})

app.delete("/accuont", verifyIfExistsAccountCpf, (request, response) => {
    const {customer} = request;

    //splice
    customers.slice(customer, 1);

    return response.status(200).json(customers)
})

app.get("/balance", verifyIfExistsAccountCpf, (request, response) => {
    const {customer} = request;

    const balance = getBalance(customer.statement)

    return response.json(balance)
})

app.listen(3333);

