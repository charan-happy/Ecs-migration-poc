import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { ApiResponse } from '@common/dto/api-response';
import { LoggerService } from '@logger/logger.service';

@Injectable()
export class ErrorHandlerService {
  constructor(private readonly logger: LoggerService) {}

  handleError(error: any, context: string): ApiResponse<null> {
    if (error instanceof PrismaClientKnownRequestError) {
      return this.handlePrismaError(error, context);
    }

    if (error instanceof HttpException) {
      return this.handleHttpException(error, context);
    }

    if (error.name === 'SocialAuthError') {
      return this.handleSocialAuthError(error, context);
    }

    return this.handleUnhandledError(error, context);
  }

  private handlePrismaError(
    error: PrismaClientKnownRequestError,
    context: string
  ): ApiResponse<null> {
    const formatMessage = (
      defaultMessage: string,
      model: string,
      field?: string | string[],
      target?: string | string[]
    ) => {
      const fieldInfo = field ? `Fields: ${Array.isArray(field) ? field.join(', ') : field}.` : '';
      const targetInfo = target
        ? `Fields: ${Array.isArray(target) ? target.join(', ') : target}.`
        : '';
      return `${defaultMessage} in table ${model}. ${fieldInfo} ${targetInfo}`.trim();
    };

    const errorHandlers = {
      P2000: () => {
        const defaultMessage = `The provided value for the column is too long for the column's type`;
        const message = formatMessage(defaultMessage, 'record');
        return this.createErrorResponse(HttpStatus.BAD_REQUEST, message, context, error);
      },
      P2002: () => {
        const target = error.meta?.['target'] as string | string[] | undefined;
        const model = String(error.meta?.['modelName'] || 'record');
        const defaultMessage = 'Unique constraint violation';
        const message = formatMessage(defaultMessage, model, undefined, target);
        return this.createErrorResponse(HttpStatus.CONFLICT, message, context, error);
      },
      P2003: () => {
        const model = String(error.meta?.['modelName'] || 'record');
        const field = error.meta?.['field'] as string | string[] | undefined;
        const defaultMessage = 'Foreign key constraint failed';
        const message = formatMessage(defaultMessage, model, field);
        return this.createErrorResponse(HttpStatus.BAD_REQUEST, message, context, error);
      },
      P2004: () => {
        const model = String(error.meta?.['modelName'] || 'record');
        const defaultMessage = 'Constraint violation';
        const message = formatMessage(defaultMessage, model);
        return this.createErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, message, context, error);
      },
      P2005: () => {
        const model = String(error.meta?.['modelName'] || 'record');
        const field = error.meta?.['field'] as string | string[] | undefined;
        const defaultMessage = 'Invalid data format';
        const message = formatMessage(defaultMessage, model, field);
        return this.createErrorResponse(HttpStatus.BAD_REQUEST, message, context, error);
      },
      P2006: () => {
        const model = String(error.meta?.['modelName'] || 'record');
        const defaultMessage = 'Invalid filter for query';
        const message = formatMessage(defaultMessage, model);
        return this.createErrorResponse(HttpStatus.BAD_REQUEST, message, context, error);
      },
      P2007: () => {
        const model = String(error.meta?.['modelName'] || 'record');
        const defaultMessage = 'Data validation error';
        const message = formatMessage(defaultMessage, model);
        return this.createErrorResponse(HttpStatus.BAD_REQUEST, message, context, error);
      },
      P2010: () => {
        const model = String(error.meta?.['modelName'] || 'record');
        const defaultMessage = 'Failed to execute raw query';
        const message = formatMessage(defaultMessage, model);
        return this.createErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, message, context, error);
      },
      P2011: () => {
        const model = String(error.meta?.['modelName'] || 'record');
        const field = error.meta?.['field'] as string | string[] | undefined;
        const defaultMessage = 'Field cannot be null';
        const message = formatMessage(defaultMessage, model, field);
        return this.createErrorResponse(HttpStatus.BAD_REQUEST, message, context, error);
      },
      P2012: () => {
        const model = String(error.meta?.['modelName'] || 'record');
        const field = error.meta?.['field'] as string | string[] | undefined;
        const defaultMessage = 'Missing value for field';
        const message = formatMessage(defaultMessage, model, field);
        return this.createErrorResponse(HttpStatus.BAD_REQUEST, message, context, error);
      },
      P2014: () => {
        const model = String(error.meta?.['modelName'] || 'record');
        const defaultMessage = 'Foreign key constraint failed during cascading delete';
        const message = formatMessage(defaultMessage, model);
        return this.createErrorResponse(HttpStatus.BAD_REQUEST, message, context, error);
      },
      P2015: () => {
        const model = String(error.meta?.['modelName'] || 'record');
        const defaultMessage = 'Record not found';
        const message = formatMessage(defaultMessage, model);
        return this.createErrorResponse(HttpStatus.NOT_FOUND, message, context, error);
      },
      P2016: () => {
        const model = String(error.meta?.['modelName'] || 'record');
        const defaultMessage = 'Query interpretation failed';
        const message = formatMessage(defaultMessage, model);
        return this.createErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, message, context, error);
      },
      P2017: () => {
        const model = String(error.meta?.['modelName'] || 'record');
        const defaultMessage = 'Required records not found';
        const message = formatMessage(defaultMessage, model);
        return this.createErrorResponse(HttpStatus.NOT_FOUND, message, context, error);
      },
      P2021: () => {
        const model = String(error.meta?.['modelName'] || 'record');
        const defaultMessage = 'Table or view not found in database';
        const message = formatMessage(defaultMessage, model);
        return this.createErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, message, context, error);
      },
      P2022: () => {
        const model = String(error.meta?.['modelName'] || 'record');
        const defaultMessage = 'Required column not found in database';
        const column = error.meta?.['column'] as string | string[] | undefined;
        const message = formatMessage(defaultMessage, model, column);
        return this.createErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, message, context, error);
      },
      P2023: () => {
        const model = String(error.meta?.['modelName'] || 'record');
        const defaultMessage = 'Database schema inconsistency';
        const message = formatMessage(defaultMessage, model);
        return this.createErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, message, context, error);
      },
      P2025: () => {
        const target = error.meta?.['target'] as string | string[] | undefined;
        const model = String(error.meta?.['modelName'] || 'record');
        const defaultMessage = String(
          error.meta?.['cause'] || 'The requested record was not found'
        );
        const column = error.meta?.['column'] as string | string[] | undefined;
        const message = formatMessage(defaultMessage, model, column, target);
        return this.createErrorResponse(HttpStatus.NOT_FOUND, message, context, error);
      },
      P2030: () => {
        const model = String(error.meta?.['modelName'] || 'record');
        const field = error.meta?.['field'] as string | string[] | undefined;
        const defaultMessage = 'Invalid JSON value for field';
        const message = formatMessage(defaultMessage, model, field);
        return this.createErrorResponse(HttpStatus.BAD_REQUEST, message, context, error);
      },
      P2033: () => {
        const model = String(error.meta?.['modelName'] || 'record');
        const defaultMessage = 'Query returned too many results';
        const message = formatMessage(defaultMessage, model);
        return this.createErrorResponse(HttpStatus.BAD_REQUEST, message, context, error);
      },
    };

    const errorHandler =
      (errorHandlers as any)[error.code] ||
      (() => {
        const model = String(error.meta?.['modelName'] || 'record');
        const field = error.meta?.['field'] as string | string[] | undefined;
        const target = error.meta?.['target'] as string | string[] | undefined;
        const defaultMessage = String(
          error.meta?.['cause'] || 'An unexpected database error occurred'
        );
        const message = formatMessage(defaultMessage, model, field, target);
        return this.createErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, message, context, error);
      });

    return errorHandler();
  }
  private handleHttpException(error: HttpException, context: string): ApiResponse<null> {
    const status = error.getStatus();
    const message = error.message;
    this.logger.warn(`${error.name} in ${context}: ${message}`, error.stack);
    return this.createErrorResponse(status, message, context, error);
  }

  private handleSocialAuthError(error: any, context: string): ApiResponse<null> {
    if (error.response) {
      this.logger.error(
        `Social auth API error in ${context}: ${JSON.stringify(error.response.data)}`,
        error.stack
      );
      return this.createErrorResponse(
        HttpStatus.BAD_REQUEST,
        error.message || 'Error occurred during social authentication.',
        context,
        error
      );
    }
    this.logger.error(`Unhandled social auth error in ${context}: ${error.message}`, error.stack);
    return this.createErrorResponse(
      HttpStatus.INTERNAL_SERVER_ERROR,
      error.message || 'An error occurred during social authentication.',
      context,
      error
    );
  }

  private handleUnhandledError(error: any, context: string): ApiResponse<null> {
    this.logger.error(`Unhandled error in ${context}: ${error.message}`, error.stack);
    if (error.message.includes('Failed to send SMS')) {
      return this.createErrorResponse(
        HttpStatus.FORBIDDEN,
        'SMS service is restricted for trial accounts. Please verify the recipient number or upgrade your Twilio account.',
        context,
        error
      );
    }
    return this.createErrorResponse(
      HttpStatus.INTERNAL_SERVER_ERROR,
      error.message || 'An unknown error occurred. Please try again later.',
      context,
      error
    );
  }

  private createErrorResponse(
    statusCode: HttpStatus,
    message: string,
    _context: string,
    _error: any,
    data?: any
  ): ApiResponse<any> {
    return {
      statusCode,
      status: 'Failure',
      message: typeof message === 'string' ? message : JSON.stringify(message) || 'Error Occured',
      error: this.formatErrorString(HttpStatus[statusCode]),
      data: data || null,
    };
  }

  private formatErrorString(error: string): string {
    return error
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  // Additional helper methods for specific error types
  handleAuthError(error: any, context: string): ApiResponse<null> {
    if (error.response && error.response.status === 401) {
      return this.createErrorResponse(
        HttpStatus.UNAUTHORIZED,
        error.message || 'Unauthorized access.',
        context,
        error
      );
    }
    if (error.response && error.response.status === 403) {
      return this.createErrorResponse(
        HttpStatus.FORBIDDEN,
        error.message || 'Access denied.',
        context,
        error
      );
    }
    return this.createErrorResponse(
      HttpStatus.INTERNAL_SERVER_ERROR,
      error.message || 'An unknown authentication error occurred.',
      context,
      error
    );
  }

  handleBadRequest(error: any, context: string): ApiResponse<null> {
    if (error.response?.message && Array.isArray(error.response.message)) {
      const cleanedMessages = error.response.message.map((msg: string) => {
        // Strip out nested prefixes like "pricing.", "input.", "data.pricing.", etc.
        return msg.replace(/^[a-zA-Z0-9_.]+?\./, '');
      });
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        status: 'Failure',
        message: cleanedMessages.join(', '),
        error: 'Validation Error',
      };
    }
    // For other bad request errors
    return this.createErrorResponse(
      HttpStatus.BAD_REQUEST,
      error.message || error.response?.message || 'Bad request.',
      context,
      error,
      error.response?.data || null
    );
  }

  handleUnauthorized(error: any, context: string): ApiResponse<null> {
    return this.createErrorResponse(
      HttpStatus.UNAUTHORIZED,
      error.message || 'Unauthorized.',
      context,
      error
    );
  }

  handleForbidden(error: any, context: string): ApiResponse<null> {
    if (error.message.includes('authorization grant is invalid')) {
      return this.createErrorResponse(
        HttpStatus.FORBIDDEN,
        'Email service is temporarily unavailable. We are working on a fix.',
        context,
        error
      );
    }
    return this.createErrorResponse(
      HttpStatus.FORBIDDEN,
      error.message || 'Forbidden.',
      context,
      error
    );
  }

  handleNotFound(error: any, context: string): ApiResponse<null> {
    return this.createErrorResponse(
      HttpStatus.NOT_FOUND,
      error.message || 'Not found.',
      context,
      error
    );
  }

  handleInternalServerError(error: any, context: string): ApiResponse<null> {
    return this.createErrorResponse(
      HttpStatus.INTERNAL_SERVER_ERROR,
      error.message || 'Internal server error.',
      context,
      error
    );
  }
}
