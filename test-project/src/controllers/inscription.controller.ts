import { Request, Response } from "express";
import { inscriptionService } from "../services/inscription.service"
import {
	inscriptionInsertSchema,
	inscriptionUpdateSchema,
	inscriptionFilterSchema,
	inscriptionPkSchema
	} from "../validators/inscription.validator";

async function getAll(req: Request, res: Response) {
    const filters = inscriptionFilterSchema.parse(req.query);
    const items = await inscriptionService.findAll(filters);
    const total = await inscriptionService.count(filters);

    res.json({
        items,
        total
    });
}

async function getOne(req: Request, res: Response) {
    const pk = inscriptionPkSchema.parse(req.params);
    const item = await inscriptionService.findOne(pk);
    res.json(item);
}

async function create(req: Request, res: Response) {
    const data = inscriptionInsertSchema.parse(req.body);
    const item = await inscriptionService.create(data);
    res.status(201).json(item);
}

async function update(req: Request, res: Response) {
    const pk = inscriptionPkSchema.parse(req.params);
    const data = inscriptionUpdateSchema.parse(req.body);
    const item = await inscriptionService.update(pk, data);
    res.status(200).json(item);
}

async function remove(req: Request, res: Response) {
    const pk = inscriptionPkSchema.parse(req.params);
    await inscriptionService.delete(pk);
    res.status(204).send();
}

export const inscriptionController = {
    getAll,
    getOne,
    create,
    update,
    remove
};