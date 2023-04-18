const QUEUE_NAME = 'mailing'

import Mail from '@ioc:Adonis/Addons/Mail'
import Rabbit from '@ioc:Adonis/Addons/Rabbit'
import { validator, schema, rules } from '@ioc:Adonis/Core/Validator'

const sendMailSchema = schema.create({
  to: schema.string({}, [rules.email()]),
  subject: schema.string(),
  message: schema.string(),
})

async function listen() {
  console.log('Mailing queue started')

  await Rabbit.assertQueue(QUEUE_NAME)

  await Rabbit.consumeFrom(QUEUE_NAME, async (message) => {
    try {
      const payload = await validator.validate({
        schema: sendMailSchema,
        data: JSON.parse(message.content),
      })

      console.log('Message sent to ', payload.to)
      await Mail.send((message) => {
        message.to(payload.to).subject(payload.subject).html(payload.message)
      })
    } catch (e) {
      console.log('SendMail payload not valid', e.message)
    }

    message.ack()
  })
}

listen()
