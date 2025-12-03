import nodemailer from 'nodemailer'


const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    secure: false,
    port: 587,
    auth: {

        user: `oktopuslabs@gmail.com`,
        pass: 'jvgl xsxj jofb ujmu',
    }
})

export default transporter