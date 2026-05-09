use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("MERCzKpGn4jqf9eFZSPVKMeS7WGmP4QhEGGdNLVwx1U");

// ─── Constants ───────────────────────────────────────────────────────────────

pub const PLATFORM_FEE_BPS: u64 = 250; // 2.5% platform fee
pub const MAX_TITLE_LEN: usize = 128;
pub const MAX_DESC_LEN: usize = 512;
pub const MAX_DOC_HASH_LEN: usize = 64; // SHA-256 hex string
pub const MAX_LAWYERS: usize = 10;
pub const MIN_STAKE_LAMPORTS: u64 = 1_000_000_000; // 1 SOL minimum stake

// ─── Program ─────────────────────────────────────────────────────────────────

#[program]
pub mod mercosuria {
    use super::*;

    // ─── Platform ────────────────────────────────────────────────────────────

    /// Initialize the global platform state (called once by admin)
    pub fn initialize_platform(
        ctx: Context<InitializePlatform>,
        fee_bps: u64,
    ) -> Result<()> {
        require!(fee_bps <= 1000, MercosuriaError::FeeTooHigh); // max 10%
        let platform = &mut ctx.accounts.platform;
        platform.authority = ctx.accounts.authority.key();
        platform.fee_bps = fee_bps;
        platform.treasury = ctx.accounts.treasury.key();
        platform.total_cases = 0;
        platform.total_resolved = 0;
        platform.bump = ctx.bumps.platform;
        emit!(PlatformInitialized {
            authority: platform.authority,
            fee_bps,
        });
        Ok(())
    }

    // ─── Lawyer Registry ─────────────────────────────────────────────────────

    /// Register a lawyer on-chain. Requires staking at least MIN_STAKE_LAMPORTS.
    pub fn register_lawyer(
        ctx: Context<RegisterLawyer>,
        name: String,
        bar_number: String,
        jurisdiction: String,
        specialization: String,
        hourly_rate_lamports: u64,
    ) -> Result<()> {
        require!(name.len() <= MAX_TITLE_LEN, MercosuriaError::StringTooLong);
        require!(bar_number.len() <= 32, MercosuriaError::StringTooLong);
        require!(jurisdiction.len() <= 64, MercosuriaError::StringTooLong);
        require!(specialization.len() <= 64, MercosuriaError::StringTooLong);
        require!(hourly_rate_lamports > 0, MercosuriaError::InvalidAmount);

        // Transfer stake from lawyer wallet to escrow vault
        let stake_amount = ctx.accounts.lawyer_vault.amount;
        require!(stake_amount >= MIN_STAKE_LAMPORTS, MercosuriaError::InsufficientStake);

        let lawyer = &mut ctx.accounts.lawyer_profile;
        lawyer.wallet = ctx.accounts.lawyer.key();
        lawyer.name = name.clone();
        lawyer.bar_number = bar_number;
        lawyer.jurisdiction = jurisdiction;
        lawyer.specialization = specialization.clone();
        lawyer.hourly_rate_lamports = hourly_rate_lamports;
        lawyer.reputation_score = 500; // start at 500/1000
        lawyer.cases_handled = 0;
        lawyer.cases_won = 0;
        lawyer.total_earned_lamports = 0;
        lawyer.is_active = true;
        lawyer.staked_lamports = stake_amount;
        lawyer.registered_at = Clock::get()?.unix_timestamp;
        lawyer.bump = ctx.bumps.lawyer_profile;

        emit!(LawyerRegistered {
            wallet: lawyer.wallet,
            name,
            specialization,
            hourly_rate_lamports,
        });
        Ok(())
    }

    /// Update lawyer availability and hourly rate
    pub fn update_lawyer_profile(
        ctx: Context<UpdateLawyerProfile>,
        hourly_rate_lamports: Option<u64>,
        is_active: Option<bool>,
    ) -> Result<()> {
        let lawyer = &mut ctx.accounts.lawyer_profile;
        if let Some(rate) = hourly_rate_lamports {
            require!(rate > 0, MercosuriaError::InvalidAmount);
            lawyer.hourly_rate_lamports = rate;
        }
        if let Some(active) = is_active {
            lawyer.is_active = active;
        }
        Ok(())
    }

    // ─── Legal Cases ─────────────────────────────────────────────────────────

    /// Open a new legal case. Client deposits funds into escrow.
    pub fn open_case(
        ctx: Context<OpenCase>,
        title: String,
        description: String,
        case_type: CaseType,
        budget_lamports: u64,
        deadline_ts: i64,
    ) -> Result<()> {
        require!(title.len() <= MAX_TITLE_LEN, MercosuriaError::StringTooLong);
        require!(description.len() <= MAX_DESC_LEN, MercosuriaError::StringTooLong);
        require!(budget_lamports > 0, MercosuriaError::InvalidAmount);

        let clock = Clock::get()?;
        require!(deadline_ts > clock.unix_timestamp, MercosuriaError::InvalidDeadline);

        // Transfer budget into case escrow
        let transfer_ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.client.key(),
            &ctx.accounts.case_escrow.key(),
            budget_lamports,
        );
        anchor_lang::solana_program::program::invoke(
            &transfer_ix,
            &[
                ctx.accounts.client.to_account_info(),
                ctx.accounts.case_escrow.to_account_info(),
            ],
        )?;

        let platform = &mut ctx.accounts.platform;
        let case = &mut ctx.accounts.legal_case;
        case.case_id = platform.total_cases;
        case.client = ctx.accounts.client.key();
        case.assigned_lawyer = None;
        case.title = title.clone();
        case.description = description;
        case.case_type = case_type.clone();
        case.status = CaseStatus::Open;
        case.budget_lamports = budget_lamports;
        case.escrowed_lamports = budget_lamports;
        case.paid_lamports = 0;
        case.deadline_ts = deadline_ts;
        case.opened_at = clock.unix_timestamp;
        case.closed_at = None;
        case.document_hashes = vec![];
        case.bump = ctx.bumps.legal_case;

        platform.total_cases += 1;

        emit!(CaseOpened {
            case_id: case.case_id,
            client: case.client,
            title,
            case_type,
            budget_lamports,
        });
        Ok(())
    }

    /// Lawyer applies for an open case
    pub fn apply_to_case(
        ctx: Context<ApplyToCase>,
        proposal: String,
        proposed_fee_lamports: u64,
    ) -> Result<()> {
        require!(proposal.len() <= MAX_DESC_LEN, MercosuriaError::StringTooLong);

        let legal_case = &ctx.accounts.legal_case;
        require!(legal_case.status == CaseStatus::Open, MercosuriaError::CaseNotOpen);
        require!(
            proposed_fee_lamports <= legal_case.budget_lamports,
            MercosuriaError::FeeExceedsBudget
        );

        let lawyer_profile = &ctx.accounts.lawyer_profile;
        require!(lawyer_profile.is_active, MercosuriaError::LawyerNotActive);

        let application = &mut ctx.accounts.case_application;
        application.case_id = legal_case.case_id;
        application.lawyer = ctx.accounts.lawyer.key();
        application.proposal = proposal;
        application.proposed_fee_lamports = proposed_fee_lamports;
        application.applied_at = Clock::get()?.unix_timestamp;
        application.accepted = false;
        application.bump = ctx.bumps.case_application;

        emit!(LawyerApplied {
            case_id: legal_case.case_id,
            lawyer: ctx.accounts.lawyer.key(),
            proposed_fee_lamports,
        });
        Ok(())
    }

    /// Client accepts a lawyer's application
    pub fn accept_lawyer(ctx: Context<AcceptLawyer>) -> Result<()> {
        let legal_case = &mut ctx.accounts.legal_case;
        require!(legal_case.status == CaseStatus::Open, MercosuriaError::CaseNotOpen);
        require!(
            legal_case.client == ctx.accounts.client.key(),
            MercosuriaError::Unauthorized
        );

        let application = &mut ctx.accounts.case_application;
        application.accepted = true;
        legal_case.assigned_lawyer = Some(ctx.accounts.lawyer.key());
        legal_case.status = CaseStatus::InProgress;

        emit!(LawyerAccepted {
            case_id: legal_case.case_id,
            lawyer: ctx.accounts.lawyer.key(),
        });
        Ok(())
    }

    // ─── Document Verification ───────────────────────────────────────────────

    /// Attach a document hash (SHA-256) to a legal case — creates an immutable audit trail
    pub fn attach_document(
        ctx: Context<AttachDocument>,
        doc_hash: String,
        doc_title: String,
        doc_type: DocumentType,
    ) -> Result<()> {
        require!(doc_hash.len() <= MAX_DOC_HASH_LEN, MercosuriaError::StringTooLong);
        require!(doc_title.len() <= MAX_TITLE_LEN, MercosuriaError::StringTooLong);

        let legal_case = &mut ctx.accounts.legal_case;
        let signer = ctx.accounts.signer.key();
        let is_client = legal_case.client == signer;
        let is_lawyer = legal_case
            .assigned_lawyer
            .map(|l| l == signer)
            .unwrap_or(false);
        require!(is_client || is_lawyer, MercosuriaError::Unauthorized);
        require!(
            legal_case.document_hashes.len() < 20,
            MercosuriaError::TooManyDocuments
        );

        let doc_record = &mut ctx.accounts.document_record;
        doc_record.case_id = legal_case.case_id;
        doc_record.uploader = signer;
        doc_record.doc_hash = doc_hash.clone();
        doc_record.doc_title = doc_title.clone();
        doc_record.doc_type = doc_type.clone();
        doc_record.uploaded_at = Clock::get()?.unix_timestamp;
        doc_record.bump = ctx.bumps.document_record;

        legal_case.document_hashes.push(doc_hash.clone());

        emit!(DocumentAttached {
            case_id: legal_case.case_id,
            uploader: signer,
            doc_hash,
            doc_title,
            doc_type,
        });
        Ok(())
    }

    // ─── Payments & Escrow ───────────────────────────────────────────────────

    /// Release partial or full payment from escrow to lawyer
    pub fn release_payment(
        ctx: Context<ReleasePayment>,
        amount_lamports: u64,
    ) -> Result<()> {
        let legal_case = &mut ctx.accounts.legal_case;
        require!(
            legal_case.client == ctx.accounts.client.key(),
            MercosuriaError::Unauthorized
        );
        require!(
            legal_case.status == CaseStatus::InProgress,
            MercosuriaError::CaseNotInProgress
        );
        require!(
            amount_lamports <= legal_case.escrowed_lamports,
            MercosuriaError::InsufficientEscrow
        );

        let platform = &ctx.accounts.platform;
        let fee = amount_lamports
            .checked_mul(platform.fee_bps)
            .unwrap()
            .checked_div(10_000)
            .unwrap();
        let lawyer_amount = amount_lamports.checked_sub(fee).unwrap();

        // Pay fee to treasury
        **ctx.accounts.case_escrow.try_borrow_mut_lamports()? -= fee;
        **ctx.accounts.treasury.try_borrow_mut_lamports()? += fee;

        // Pay lawyer
        **ctx.accounts.case_escrow.try_borrow_mut_lamports()? -= lawyer_amount;
        **ctx.accounts.lawyer_wallet.try_borrow_mut_lamports()? += lawyer_amount;

        legal_case.escrowed_lamports -= amount_lamports;
        legal_case.paid_lamports += lawyer_amount;

        // Update lawyer stats
        let lawyer_profile = &mut ctx.accounts.lawyer_profile;
        lawyer_profile.total_earned_lamports += lawyer_amount;

        emit!(PaymentReleased {
            case_id: legal_case.case_id,
            lawyer: ctx.accounts.lawyer_wallet.key(),
            amount_lamports: lawyer_amount,
            fee_lamports: fee,
        });
        Ok(())
    }

    /// Close a case and optionally release remaining escrow back to client
    pub fn close_case(
        ctx: Context<CloseCase>,
        outcome: CaseOutcome,
        resolution_notes: String,
    ) -> Result<()> {
        require!(resolution_notes.len() <= MAX_DESC_LEN, MercosuriaError::StringTooLong);

        let legal_case = &mut ctx.accounts.legal_case;
        require!(
            legal_case.client == ctx.accounts.client.key(),
            MercosuriaError::Unauthorized
        );
        require!(
            legal_case.status == CaseStatus::InProgress
                || legal_case.status == CaseStatus::Open,
            MercosuriaError::CaseAlreadyClosed
        );

        let remaining = legal_case.escrowed_lamports;
        if remaining > 0 {
            // Return unspent escrow to client
            **ctx.accounts.case_escrow.try_borrow_mut_lamports()? -= remaining;
            **ctx.accounts.client.try_borrow_mut_lamports()? += remaining;
            legal_case.escrowed_lamports = 0;
        }

        legal_case.status = CaseStatus::Closed;
        legal_case.closed_at = Some(Clock::get()?.unix_timestamp);

        // Update lawyer reputation based on outcome
        if let Some(_lawyer_key) = legal_case.assigned_lawyer {
            let lawyer_profile = &mut ctx.accounts.lawyer_profile;
            lawyer_profile.cases_handled += 1;
            match outcome {
                CaseOutcome::ClientWon => {
                    lawyer_profile.reputation_score =
                        (lawyer_profile.reputation_score + 20).min(1000);
                    lawyer_profile.cases_won += 1;
                }
                CaseOutcome::SettledAmicably => {
                    lawyer_profile.reputation_score =
                        (lawyer_profile.reputation_score + 10).min(1000);
                }
                CaseOutcome::ClientLost => {
                    lawyer_profile.reputation_score =
                        lawyer_profile.reputation_score.saturating_sub(5);
                }
                CaseOutcome::Dismissed => {}
            }
        }

        let platform = &mut ctx.accounts.platform;
        platform.total_resolved += 1;

        emit!(CaseClosed {
            case_id: legal_case.case_id,
            outcome,
            refund_lamports: remaining,
        });
        Ok(())
    }

    /// Submit a review for a lawyer after case closure
    pub fn submit_review(
        ctx: Context<SubmitReview>,
        rating: u8,
        comment: String,
    ) -> Result<()> {
        require!(rating >= 1 && rating <= 5, MercosuriaError::InvalidRating);
        require!(comment.len() <= MAX_DESC_LEN, MercosuriaError::StringTooLong);

        let legal_case = &ctx.accounts.legal_case;
        require!(legal_case.status == CaseStatus::Closed, MercosuriaError::CaseNotClosed);
        require!(legal_case.client == ctx.accounts.client.key(), MercosuriaError::Unauthorized);

        let review = &mut ctx.accounts.lawyer_review;
        review.case_id = legal_case.case_id;
        review.reviewer = ctx.accounts.client.key();
        review.lawyer = ctx.accounts.lawyer.key();
        review.rating = rating;
        review.comment = comment;
        review.created_at = Clock::get()?.unix_timestamp;
        review.bump = ctx.bumps.lawyer_review;

        // Adjust reputation score (weighted towards recent reviews)
        let lawyer_profile = &mut ctx.accounts.lawyer_profile;
        let delta: i64 = (rating as i64 - 3) * 10; // -20 to +20
        let new_score = (lawyer_profile.reputation_score as i64 + delta)
            .clamp(0, 1000) as u64;
        lawyer_profile.reputation_score = new_score;

        emit!(ReviewSubmitted {
            case_id: legal_case.case_id,
            lawyer: ctx.accounts.lawyer.key(),
            rating,
        });
        Ok(())
    }

    // ─── Dispute Resolution ──────────────────────────────────────────────────

    /// Raise a dispute on an in-progress case (goes to arbitration)
    pub fn raise_dispute(
        ctx: Context<RaiseDispute>,
        reason: String,
    ) -> Result<()> {
        require!(reason.len() <= MAX_DESC_LEN, MercosuriaError::StringTooLong);

        let legal_case = &mut ctx.accounts.legal_case;
        let signer = ctx.accounts.signer.key();
        let is_client = legal_case.client == signer;
        let is_lawyer = legal_case
            .assigned_lawyer
            .map(|l| l == signer)
            .unwrap_or(false);
        require!(is_client || is_lawyer, MercosuriaError::Unauthorized);
        require!(
            legal_case.status == CaseStatus::InProgress,
            MercosuriaError::CaseNotInProgress
        );

        legal_case.status = CaseStatus::Disputed;

        let dispute = &mut ctx.accounts.dispute;
        dispute.case_id = legal_case.case_id;
        dispute.raised_by = signer;
        dispute.reason = reason;
        dispute.arbitrator = None;
        dispute.resolved = false;
        dispute.raised_at = Clock::get()?.unix_timestamp;
        dispute.bump = ctx.bumps.dispute;

        emit!(DisputeRaised {
            case_id: legal_case.case_id,
            raised_by: signer,
        });
        Ok(())
    }

    /// Platform authority resolves a dispute
    pub fn resolve_dispute(
        ctx: Context<ResolveDispute>,
        ruling: DisputeRuling,
        notes: String,
    ) -> Result<()> {
        require!(notes.len() <= MAX_DESC_LEN, MercosuriaError::StringTooLong);

        let platform = &ctx.accounts.platform;
        require!(
            platform.authority == ctx.accounts.authority.key(),
            MercosuriaError::Unauthorized
        );

        let legal_case = &mut ctx.accounts.legal_case;
        require!(legal_case.status == CaseStatus::Disputed, MercosuriaError::NotDisputed);

        let escrowed = legal_case.escrowed_lamports;

        match ruling {
            DisputeRuling::FavorClient => {
                // Refund all escrow to client
                **ctx.accounts.case_escrow.try_borrow_mut_lamports()? -= escrowed;
                **ctx.accounts.client.try_borrow_mut_lamports()? += escrowed;
                legal_case.escrowed_lamports = 0;
                // Slash lawyer stake
                let lawyer_profile = &mut ctx.accounts.lawyer_profile;
                lawyer_profile.reputation_score =
                    lawyer_profile.reputation_score.saturating_sub(100);
            }
            DisputeRuling::FavorLawyer => {
                // Release remaining escrow to lawyer
                let fee = escrowed
                    .checked_mul(platform.fee_bps)
                    .unwrap()
                    .checked_div(10_000)
                    .unwrap();
                let lawyer_amount = escrowed - fee;
                **ctx.accounts.case_escrow.try_borrow_mut_lamports()? -= escrowed;
                **ctx.accounts.treasury.try_borrow_mut_lamports()? += fee;
                **ctx.accounts.lawyer_wallet.try_borrow_mut_lamports()? += lawyer_amount;
                legal_case.escrowed_lamports = 0;
                legal_case.paid_lamports += lawyer_amount;
            }
            DisputeRuling::SplitEvenly => {
                let half = escrowed / 2;
                let lawyer_fee = half
                    .checked_mul(platform.fee_bps)
                    .unwrap()
                    .checked_div(10_000)
                    .unwrap();
                **ctx.accounts.case_escrow.try_borrow_mut_lamports()? -= escrowed;
                **ctx.accounts.client.try_borrow_mut_lamports()? += half;
                **ctx.accounts.lawyer_wallet.try_borrow_mut_lamports()? += half - lawyer_fee;
                **ctx.accounts.treasury.try_borrow_mut_lamports()? += lawyer_fee;
                legal_case.escrowed_lamports = 0;
            }
        }

        legal_case.status = CaseStatus::Closed;
        legal_case.closed_at = Some(Clock::get()?.unix_timestamp);

        let dispute = &mut ctx.accounts.dispute;
        dispute.arbitrator = Some(ctx.accounts.authority.key());
        dispute.resolved = true;

        emit!(DisputeResolved {
            case_id: legal_case.case_id,
            ruling,
        });
        Ok(())
    }
}

// ─── Accounts ────────────────────────────────────────────────────────────────

#[derive(Accounts)]
pub struct InitializePlatform<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + PlatformState::INIT_SPACE,
        seeds = [b"platform"],
        bump
    )]
    pub platform: Account<'info, PlatformState>,
    /// CHECK: treasury is just a SOL receiver
    pub treasury: AccountInfo<'info>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RegisterLawyer<'info> {
    #[account(
        init,
        payer = lawyer,
        space = 8 + LawyerProfile::INIT_SPACE,
        seeds = [b"lawyer", lawyer.key().as_ref()],
        bump
    )]
    pub lawyer_profile: Account<'info, LawyerProfile>,
    /// Token account holding lawyer's stake in SOL-equivalent (or native vault)
    /// CHECK: validated by amount check in handler
    pub lawyer_vault: AccountInfo<'info>,
    #[account(mut)]
    pub lawyer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateLawyerProfile<'info> {
    #[account(
        mut,
        seeds = [b"lawyer", lawyer.key().as_ref()],
        bump = lawyer_profile.bump,
        has_one = wallet @ MercosuriaError::Unauthorized
    )]
    pub lawyer_profile: Account<'info, LawyerProfile>,
    pub lawyer: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(title: String)]
pub struct OpenCase<'info> {
    #[account(
        mut,
        seeds = [b"platform"],
        bump = platform.bump
    )]
    pub platform: Account<'info, PlatformState>,
    #[account(
        init,
        payer = client,
        space = 8 + LegalCase::INIT_SPACE,
        seeds = [b"case", client.key().as_ref(), &platform.total_cases.to_le_bytes()],
        bump
    )]
    pub legal_case: Account<'info, LegalCase>,
    /// CHECK: escrow PDA that holds case funds
    #[account(
        mut,
        seeds = [b"case_escrow", client.key().as_ref(), &platform.total_cases.to_le_bytes()],
        bump
    )]
    pub case_escrow: AccountInfo<'info>,
    #[account(mut)]
    pub client: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ApplyToCase<'info> {
    #[account(mut)]
    pub legal_case: Account<'info, LegalCase>,
    #[account(
        init,
        payer = lawyer,
        space = 8 + CaseApplication::INIT_SPACE,
        seeds = [b"application", legal_case.key().as_ref(), lawyer.key().as_ref()],
        bump
    )]
    pub case_application: Account<'info, CaseApplication>,
    #[account(
        seeds = [b"lawyer", lawyer.key().as_ref()],
        bump = lawyer_profile.bump
    )]
    pub lawyer_profile: Account<'info, LawyerProfile>,
    #[account(mut)]
    pub lawyer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AcceptLawyer<'info> {
    #[account(mut)]
    pub legal_case: Account<'info, LegalCase>,
    #[account(mut)]
    pub case_application: Account<'info, CaseApplication>,
    /// CHECK: lawyer wallet, validated in handler
    pub lawyer: AccountInfo<'info>,
    pub client: Signer<'info>,
}

#[derive(Accounts)]
pub struct AttachDocument<'info> {
    #[account(mut)]
    pub legal_case: Account<'info, LegalCase>,
    #[account(
        init,
        payer = signer,
        space = 8 + DocumentRecord::INIT_SPACE,
        seeds = [
            b"document",
            legal_case.key().as_ref(),
            &(legal_case.document_hashes.len() as u64).to_le_bytes()
        ],
        bump
    )]
    pub document_record: Account<'info, DocumentRecord>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ReleasePayment<'info> {
    #[account(
        seeds = [b"platform"],
        bump = platform.bump
    )]
    pub platform: Account<'info, PlatformState>,
    #[account(mut)]
    pub legal_case: Account<'info, LegalCase>,
    #[account(
        mut,
        seeds = [b"case_escrow", legal_case.client.as_ref(), &legal_case.case_id.to_le_bytes()],
        bump
    )]
    /// CHECK: escrow PDA
    pub case_escrow: AccountInfo<'info>,
    #[account(
        mut,
        seeds = [b"lawyer", lawyer_wallet.key().as_ref()],
        bump = lawyer_profile.bump
    )]
    pub lawyer_profile: Account<'info, LawyerProfile>,
    /// CHECK: validated as assigned lawyer
    #[account(mut)]
    pub lawyer_wallet: AccountInfo<'info>,
    /// CHECK: treasury receives fees
    #[account(mut, address = platform.treasury)]
    pub treasury: AccountInfo<'info>,
    pub client: Signer<'info>,
}

#[derive(Accounts)]
pub struct CloseCase<'info> {
    #[account(
        mut,
        seeds = [b"platform"],
        bump = platform.bump
    )]
    pub platform: Account<'info, PlatformState>,
    #[account(mut)]
    pub legal_case: Account<'info, LegalCase>,
    #[account(
        mut,
        seeds = [b"case_escrow", legal_case.client.as_ref(), &legal_case.case_id.to_le_bytes()],
        bump
    )]
    /// CHECK: escrow PDA
    pub case_escrow: AccountInfo<'info>,
    #[account(mut)]
    pub lawyer_profile: Account<'info, LawyerProfile>,
    #[account(mut)]
    pub client: Signer<'info>,
}

#[derive(Accounts)]
pub struct SubmitReview<'info> {
    pub legal_case: Account<'info, LegalCase>,
    #[account(
        init,
        payer = client,
        space = 8 + LawyerReview::INIT_SPACE,
        seeds = [b"review", legal_case.key().as_ref()],
        bump
    )]
    pub lawyer_review: Account<'info, LawyerReview>,
    #[account(mut)]
    pub lawyer_profile: Account<'info, LawyerProfile>,
    /// CHECK: lawyer pubkey
    pub lawyer: AccountInfo<'info>,
    #[account(mut)]
    pub client: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RaiseDispute<'info> {
    #[account(mut)]
    pub legal_case: Account<'info, LegalCase>,
    #[account(
        init,
        payer = signer,
        space = 8 + Dispute::INIT_SPACE,
        seeds = [b"dispute", legal_case.key().as_ref()],
        bump
    )]
    pub dispute: Account<'info, Dispute>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ResolveDispute<'info> {
    #[account(
        seeds = [b"platform"],
        bump = platform.bump
    )]
    pub platform: Account<'info, PlatformState>,
    #[account(mut)]
    pub legal_case: Account<'info, LegalCase>,
    #[account(mut)]
    pub dispute: Account<'info, Dispute>,
    #[account(
        mut,
        seeds = [b"case_escrow", legal_case.client.as_ref(), &legal_case.case_id.to_le_bytes()],
        bump
    )]
    /// CHECK: escrow PDA
    pub case_escrow: AccountInfo<'info>,
    #[account(mut)]
    pub lawyer_profile: Account<'info, LawyerProfile>,
    /// CHECK: client wallet for refund
    #[account(mut, address = legal_case.client)]
    pub client: AccountInfo<'info>,
    /// CHECK: lawyer wallet for payout
    #[account(mut)]
    pub lawyer_wallet: AccountInfo<'info>,
    /// CHECK: treasury
    #[account(mut, address = platform.treasury)]
    pub treasury: AccountInfo<'info>,
    pub authority: Signer<'info>,
}

// ─── State Accounts ───────────────────────────────────────────────────────────

#[account]
#[derive(InitSpace)]
pub struct PlatformState {
    pub authority: Pubkey,
    pub treasury: Pubkey,
    pub fee_bps: u64,
    pub total_cases: u64,
    pub total_resolved: u64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct LawyerProfile {
    pub wallet: Pubkey,
    #[max_len(128)]
    pub name: String,
    #[max_len(32)]
    pub bar_number: String,
    #[max_len(64)]
    pub jurisdiction: String,
    #[max_len(64)]
    pub specialization: String,
    pub hourly_rate_lamports: u64,
    pub reputation_score: u64, // 0-1000
    pub cases_handled: u64,
    pub cases_won: u64,
    pub total_earned_lamports: u64,
    pub is_active: bool,
    pub staked_lamports: u64,
    pub registered_at: i64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct LegalCase {
    pub case_id: u64,
    pub client: Pubkey,
    pub assigned_lawyer: Option<Pubkey>,
    #[max_len(128)]
    pub title: String,
    #[max_len(512)]
    pub description: String,
    pub case_type: CaseType,
    pub status: CaseStatus,
    pub budget_lamports: u64,
    pub escrowed_lamports: u64,
    pub paid_lamports: u64,
    pub deadline_ts: i64,
    pub opened_at: i64,
    pub closed_at: Option<i64>,
    #[max_len(20, 64)] // up to 20 SHA-256 hashes
    pub document_hashes: Vec<String>,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct CaseApplication {
    pub case_id: u64,
    pub lawyer: Pubkey,
    #[max_len(512)]
    pub proposal: String,
    pub proposed_fee_lamports: u64,
    pub applied_at: i64,
    pub accepted: bool,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct DocumentRecord {
    pub case_id: u64,
    pub uploader: Pubkey,
    #[max_len(64)]
    pub doc_hash: String,
    #[max_len(128)]
    pub doc_title: String,
    pub doc_type: DocumentType,
    pub uploaded_at: i64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct LawyerReview {
    pub case_id: u64,
    pub reviewer: Pubkey,
    pub lawyer: Pubkey,
    pub rating: u8,
    #[max_len(512)]
    pub comment: String,
    pub created_at: i64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Dispute {
    pub case_id: u64,
    pub raised_by: Pubkey,
    #[max_len(512)]
    pub reason: String,
    pub arbitrator: Option<Pubkey>,
    pub resolved: bool,
    pub raised_at: i64,
    pub bump: u8,
}

// ─── Enums ────────────────────────────────────────────────────────────────────

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace)]
pub enum CaseType {
    ContractDispute,
    IntellectualProperty,
    CommercialLaw,
    LaborLaw,
    ConsumerProtection,
    RegulatoryCompliance,
    ArbitrationMercosur,
    TradeLaw,
    Other,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace)]
pub enum CaseStatus {
    Open,
    InProgress,
    Disputed,
    Closed,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace)]
pub enum CaseOutcome {
    ClientWon,
    ClientLost,
    SettledAmicably,
    Dismissed,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace)]
pub enum DocumentType {
    Contract,
    Evidence,
    LegalBrief,
    CourtOrder,
    Settlement,
    InvoiceReceipt,
    IdentityDocument,
    Other,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace)]
pub enum DisputeRuling {
    FavorClient,
    FavorLawyer,
    SplitEvenly,
}

// ─── Events ───────────────────────────────────────────────────────────────────

#[event]
pub struct PlatformInitialized {
    pub authority: Pubkey,
    pub fee_bps: u64,
}

#[event]
pub struct LawyerRegistered {
    pub wallet: Pubkey,
    pub name: String,
    pub specialization: String,
    pub hourly_rate_lamports: u64,
}

#[event]
pub struct CaseOpened {
    pub case_id: u64,
    pub client: Pubkey,
    pub title: String,
    pub case_type: CaseType,
    pub budget_lamports: u64,
}

#[event]
pub struct LawyerApplied {
    pub case_id: u64,
    pub lawyer: Pubkey,
    pub proposed_fee_lamports: u64,
}

#[event]
pub struct LawyerAccepted {
    pub case_id: u64,
    pub lawyer: Pubkey,
}

#[event]
pub struct DocumentAttached {
    pub case_id: u64,
    pub uploader: Pubkey,
    pub doc_hash: String,
    pub doc_title: String,
    pub doc_type: DocumentType,
}

#[event]
pub struct PaymentReleased {
    pub case_id: u64,
    pub lawyer: Pubkey,
    pub amount_lamports: u64,
    pub fee_lamports: u64,
}

#[event]
pub struct CaseClosed {
    pub case_id: u64,
    pub outcome: CaseOutcome,
    pub refund_lamports: u64,
}

#[event]
pub struct ReviewSubmitted {
    pub case_id: u64,
    pub lawyer: Pubkey,
    pub rating: u8,
}

#[event]
pub struct DisputeRaised {
    pub case_id: u64,
    pub raised_by: Pubkey,
}

#[event]
pub struct DisputeResolved {
    pub case_id: u64,
    pub ruling: DisputeRuling,
}

// ─── Errors ───────────────────────────────────────────────────────────────────

#[error_code]
pub enum MercosuriaError {
    #[msg("Fee basis points too high (max 1000 = 10%)")]
    FeeTooHigh,
    #[msg("String exceeds maximum length")]
    StringTooLong,
    #[msg("Amount must be greater than zero")]
    InvalidAmount,
    #[msg("Insufficient stake — must stake at least 1 SOL")]
    InsufficientStake,
    #[msg("Case is not open for applications")]
    CaseNotOpen,
    #[msg("Proposed fee exceeds case budget")]
    FeeExceedsBudget,
    #[msg("Lawyer profile is not active")]
    LawyerNotActive,
    #[msg("Unauthorized — signer is not the authorized party")]
    Unauthorized,
    #[msg("Case is not currently in progress")]
    CaseNotInProgress,
    #[msg("Insufficient funds in escrow")]
    InsufficientEscrow,
    #[msg("Case has already been closed")]
    CaseAlreadyClosed,
    #[msg("Case is not closed")]
    CaseNotClosed,
    #[msg("Case is not under dispute")]
    NotDisputed,
    #[msg("Rating must be between 1 and 5")]
    InvalidRating,
    #[msg("Deadline must be in the future")]
    InvalidDeadline,
    #[msg("Maximum number of documents reached")]
    TooManyDocuments,
}
