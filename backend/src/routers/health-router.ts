import express, { Request, Response } from 'express'
import { handleAsync } from '../core/express-middleware.js'

const healthRouter = express.Router({ mergeParams: true })

healthRouter.get(
  '/',
  handleAsync(async (req: Request, res: Response) => {
    return res.status(200).json({ message: 'ok' })
  }),
)

export { healthRouter }
