// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SoulboundCertificate
 * @notice Non-transferable (soulbound) ERC-721 for on-chain verifiable credentials.
 * @dev Certificates are minted by authorized issuers to student wallets.
 *      They cannot be transferred after minting. Issuers can revoke
 *      certificates they issued without transferring or destroying them.
 */
contract SoulboundCertificate is ERC721, Ownable {
    // ---------------------------------------------------------------
    // Types
    // ---------------------------------------------------------------

    struct Certificate {
        string metadataURI;
        address issuer;
        uint256 issuedAt;
        bool revoked;
    }

    // ---------------------------------------------------------------
    // State
    // ---------------------------------------------------------------

    /// @dev Auto-incrementing token ID counter (starts at 1).
    uint256 private _nextTokenId;

    /// @dev Authorized issuer whitelist.
    mapping(address => bool) private _authorizedIssuers;

    /// @dev Certificate data by token ID.
    mapping(uint256 => Certificate) private _certificates;

    // ---------------------------------------------------------------
    // Events
    // ---------------------------------------------------------------

    event IssuerAuthorized(address indexed issuer);
    event IssuerRemoved(address indexed issuer);

    event CertificateIssued(
        uint256 indexed tokenId,
        address indexed student,
        address indexed issuer,
        string metadataURI
    );

    event CertificateRevoked(
        uint256 indexed tokenId,
        address indexed issuer
    );

    // ---------------------------------------------------------------
    // Errors
    // ---------------------------------------------------------------

    error ZeroAddress();
    error NotAuthorizedIssuer();
    error EmptyMetadataURI();
    error CertificateDoesNotExist();
    error CertificateAlreadyRevoked();
    error NotCertificateIssuer();
    error SoulboundTransferNotAllowed();
    error SoulboundApprovalNotAllowed();

    // ---------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------

    constructor()
        ERC721("SoulboundCertificate", "SBC")
        Ownable(msg.sender)
    {
        _nextTokenId = 1;
    }

    // ---------------------------------------------------------------
    // Issuer Management  (owner only)
    // ---------------------------------------------------------------

    /**
     * @notice Authorize an address as a certificate issuer.
     * @param issuer The address to authorize.
     */
    function addIssuer(address issuer) external onlyOwner {
        if (issuer == address(0)) revert ZeroAddress();
        _authorizedIssuers[issuer] = true;
        emit IssuerAuthorized(issuer);
    }

    /**
     * @notice Remove an address from the authorized issuers list.
     * @param issuer The address to remove.
     */
    function removeIssuer(address issuer) external onlyOwner {
        if (issuer == address(0)) revert ZeroAddress();
        _authorizedIssuers[issuer] = false;
        emit IssuerRemoved(issuer);
    }

    /**
     * @notice Check whether an address is an authorized issuer.
     * @param issuer The address to check.
     * @return True if the address is authorized.
     */
    function isAuthorizedIssuer(address issuer) external view returns (bool) {
        return _authorizedIssuers[issuer];
    }

    // ---------------------------------------------------------------
    // Minting
    // ---------------------------------------------------------------

    /**
     * @notice Mint a soulbound certificate to a student wallet.
     * @param student The student's wallet address (becomes the NFT owner).
     * @param metadataURI IPFS URI referencing the certificate metadata.
     * @return tokenId The newly minted token ID.
     */
    function mintCertificate(
        address student,
        string calldata metadataURI
    ) external returns (uint256 tokenId) {
        if (!_authorizedIssuers[msg.sender]) revert NotAuthorizedIssuer();
        if (student == address(0)) revert ZeroAddress();
        if (bytes(metadataURI).length == 0) revert EmptyMetadataURI();

        tokenId = _nextTokenId;
        _nextTokenId++;

        // Mint the NFT to the student.
        _safeMint(student, tokenId);

        // Store certificate data.
        _certificates[tokenId] = Certificate({
            metadataURI: metadataURI,
            issuer: msg.sender,
            issuedAt: block.timestamp,
            revoked: false
        });

        emit CertificateIssued(tokenId, student, msg.sender, metadataURI);
    }

    // ---------------------------------------------------------------
    // Revocation
    // ---------------------------------------------------------------

    /**
     * @notice Revoke a certificate. Only the original issuer can revoke.
     *         The NFT remains owned by the student; it is NOT transferred
     *         or burned.
     * @param tokenId The token ID to revoke.
     */
    function revokeCertificate(uint256 tokenId) external {
        // _requireOwned reverts with ERC721NonexistentToken if token doesn't exist
        _requireOwned(tokenId);

        Certificate storage cert = _certificates[tokenId];
        if (cert.issuer == address(0)) revert CertificateDoesNotExist();
        if (!_authorizedIssuers[msg.sender]) revert NotAuthorizedIssuer();
        if (cert.issuer != msg.sender) revert NotCertificateIssuer();
        if (cert.revoked) revert CertificateAlreadyRevoked();

        cert.revoked = true;

        emit CertificateRevoked(tokenId, msg.sender);
    }

    // ---------------------------------------------------------------
    // Verification  (public, no auth required)
    // ---------------------------------------------------------------

    /**
     * @notice Get full certificate information.
     * @param tokenId The token ID to query.
     * @return student  The certificate owner (student wallet).
     * @return metadataURI  IPFS URI for the certificate metadata.
     * @return issuer  The address that issued the certificate.
     * @return issuedAt  Unix timestamp when the certificate was issued.
     * @return revoked  Whether the certificate has been revoked.
     */
    function getCertificate(uint256 tokenId)
        external
        view
        returns (
            address student,
            string memory metadataURI,
            address issuer,
            uint256 issuedAt,
            bool revoked
        )
    {
        // Reverts if token doesn't exist.
        student = _requireOwned(tokenId);

        Certificate storage cert = _certificates[tokenId];
        metadataURI = cert.metadataURI;
        issuer = cert.issuer;
        issuedAt = cert.issuedAt;
        revoked = cert.revoked;
    }

    /**
     * @notice Check if a certificate is valid (exists and not revoked).
     * @param tokenId The token ID to check.
     * @return True if the certificate exists and is not revoked.
     */
    function isCertificateValid(uint256 tokenId) external view returns (bool) {
        // Returns false for non-existent tokens instead of reverting.
        address owner = _ownerOf(tokenId);
        if (owner == address(0)) return false;

        return !_certificates[tokenId].revoked;
    }

    /**
     * @notice Get the next token ID that will be minted.
     * @return The next token ID.
     */
    function nextTokenId() external view returns (uint256) {
        return _nextTokenId;
    }

    // ---------------------------------------------------------------
    // Soulbound: Block transfers after minting
    // ---------------------------------------------------------------

    /**
     * @dev Override _update to prevent any transfer after minting.
     *      Minting (from == address(0)) is allowed.
     *      Burning (to == address(0)) is NOT allowed by design.
     *      Regular transfers are blocked.
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override returns (address) {
        address from = _ownerOf(tokenId);

        // Allow minting (from is zero address).
        // Block everything else (transfers and burns).
        if (from != address(0) && to != address(0)) {
            revert SoulboundTransferNotAllowed();
        }
        // Also block burning.
        if (from != address(0) && to == address(0)) {
            revert SoulboundTransferNotAllowed();
        }

        return super._update(to, tokenId, auth);
    }

    /**
     * @dev Block approve — no one should be able to set approval
     *      since transfers are not allowed.
     */
    function approve(address, uint256) public pure override {
        revert SoulboundApprovalNotAllowed();
    }

    /**
     * @dev Block setApprovalForAll — same reason as approve.
     */
    function setApprovalForAll(address, bool) public pure override {
        revert SoulboundApprovalNotAllowed();
    }

    // ---------------------------------------------------------------
    // ERC-721 metadata override
    // ---------------------------------------------------------------

    /**
     * @dev Return the metadataURI stored in the Certificate struct
     *      instead of constructing from a base URI.
     */
    function tokenURI(uint256 tokenId)
        public
        view
        override
        returns (string memory)
    {
        _requireOwned(tokenId);
        return _certificates[tokenId].metadataURI;
    }
}
