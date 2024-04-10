const authorizedUsers = require("../authorized_numbers.json");
const { updateDocument, createDocument, getDocument, getDocuments, getDocumentsWhere } = require("../database/querys");

exports.updateAttempts = async (req, res) => {
  try {
    const body = req.body;

    // verify if the number is in the authorized users
    let user = await getDocumentsWhere("users", [{ field: "phoneNumber", operator: "==", value: body.phoneNumber }]);
    user = user[0]; // get the first element of the array (if exists) because the function returns an array

    if (!user) {
      return res.status(401).send(`El numero de celular ${body.phoneNumber} no existe`);
    }

    // update the user attempts
    await updateDocument("users", user.id, { Attempts: body.Attempts });
    return res.status(200).send(`El numero de celular ${body.phoneNumber} ahora tiene ${body.Attempts} intentos`);
  } catch (error) {
    return res.status(500).send("Error Interno", error);
  }
};

exports.getAttempts = async (req, res) => {
  try {
    const body = req.body;

    // verify if the number is in the authorized users
    const user = await getDocumentsWhere("users", [{ field: "phoneNumber", operator: "==", value: body.phoneNumber }]);
    if (!user[0]) {
      return res
        .status(401)
        .send(`El numero de celular ${body.phoneNumber} no existe en la lista de usuarios autorizados`);
    }

    return res.status(200).send(`El numero de celular ${body.phoneNumber} tiene ${user.Attempts} intentos`);
  } catch (error) {
    return res.status(500).send("Error Interno", error);
  }
};

exports.getUsers = async (req, res) => {
  const users = await getDocuments("users");
  return res.status(200).send(users);
};

exports.addUser = async (req, res) => {
  try {
    const body = req.body;

    // verify if the number is in the authorized users
    const user = await getDocumentsWhere("users", [{ field: "phoneNumber", operator: "==", value: body.phoneNumber }]);
    console.log("user", user);
    if (user[0]) {
      return res.status(401).send(`El numero de celular ${body.phoneNumber} no se puede crear de nuevo`);
    }

    await createDocument("users", { phoneNumber: body.phoneNumber, Attempts: body.Attempts });
    return res
      .status(200)
      .send(
        `El numero de celular ${body.phoneNumber} ha sido agregado a la lista de usuarios autorizados con ${body.Attempts} intentos ${user.Attemps} intentos`
      );
  } catch (error) {
    console.log(error);
    throw new Error(error);
  }
};
