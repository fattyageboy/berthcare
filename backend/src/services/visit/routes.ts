import { Router, Request, Response } from 'express';
import { visitController } from './controller';
import {
  getVisitsValidation,
  checkInValidation,
  updateDocumentationValidation,
  completeVisitValidation,
  verifyLocationValidation,
} from './validators';

/**
 * Visit Routes
 * API endpoints for visit management
 */

const router = Router();

// GET /visits - Retrieve visits for authenticated user
router.get('/visits', getVisitsValidation, (req: Request, res: Response) => {
  void visitController.getVisits(req, res);
});

// POST /visits/:id/check-in - Check in to a visit
router.post('/visits/:id/check-in', checkInValidation, (req: Request, res: Response) => {
  void visitController.checkIn(req, res);
});

// POST /visits/:id/verify-location - Verify location against client address
router.post(
  '/visits/:id/verify-location',
  verifyLocationValidation,
  (req: Request, res: Response) => {
    void visitController.verifyLocation(req, res);
  }
);

// PUT /visits/:id/documentation - Update visit documentation
router.put(
  '/visits/:id/documentation',
  updateDocumentationValidation,
  (req: Request, res: Response) => {
    void visitController.updateDocumentation(req, res);
  }
);

// POST /visits/:id/complete - Complete a visit
router.post('/visits/:id/complete', completeVisitValidation, (req: Request, res: Response) => {
  void visitController.completeVisit(req, res);
});

export default router;
